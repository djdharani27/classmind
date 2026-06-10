import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import {
  createSession,
  getSessionByCode,
  joinSession,
  startSession,
  completeSession,
  submitAnswers,
  setAIMisconception,
  getStudentEvidence,
  getClassOverview,
  saveAdaptiveTest,
  getAdaptiveTest,
  getAllAdaptiveTests,
} from "./src/lib/db";
import { analyzeMisconception, generateAdaptiveAssessment } from "./src/lib/openrouter";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("[socket] connected:", socket.id);

    socket.on("create_session", async (data: { teacherName: string; subject: string; questions: Record<string, unknown>[]; timeLimit: number }) => {
      const session = createSession(data.teacherName, data.subject, data.questions as { text: string; type: string; options: string[]; answer: string; subject: string; topic: string; concept: string; difficulty: string }[], data.timeLimit);
      socket.join(session.id);
      socket.join(session.code);
      socket.emit("session_created", session);
    });

    socket.on("join_session", async (data: { code: string; studentName: string }) => {
      const result = joinSession(data.code, data.studentName);
      if (!result) {
        socket.emit("join_error", "Session not found");
        return;
      }
      socket.join(result.session.id);
      socket.join(data.code.toUpperCase());
      socket.emit("student_joined", result);
      io.to(result.session.id).emit("session_updated", result.session);
      io.to(data.code.toUpperCase()).emit("session_updated", result.session);
    });

    socket.on("start_session", async (data: { sessionId: string }) => {
      const session = startSession(data.sessionId);
      if (session) {
        io.to(data.sessionId).emit("session_updated", session);
        io.to(data.sessionId).emit("assessment_started", session);
      }
    });

    socket.on("complete_session", async (data: { sessionId: string }) => {
      const session = completeSession(data.sessionId);
      if (session) {
        io.to(data.sessionId).emit("session_updated", session);
        io.to(data.sessionId).emit("assessment_ended", session);
      }
    });

    socket.on("submit_answers", async (data: { sessionId: string; studentId: string; answers: { questionId: string; answer: string }[] }) => {
      const session = submitAnswers(data.sessionId, data.studentId, data.answers);
      if (session) {
        io.to(data.sessionId).emit("session_updated", session);
        socket.emit("answers_submitted", { success: true });
      }
    });

    socket.on("analyze_student", async (data: { sessionId: string; studentId: string; studentName: string }) => {
      const evidence = getStudentEvidence(data.sessionId, data.studentId);
      if (!evidence) return;

      const incorrectAnswers = evidence.answers.filter(a => !a.correct);
      for (const a of incorrectAnswers) {
        if (!a.question) continue;
        const analysis = await analyzeMisconception(
          a.question.text || "",
          a.question.answer || "",
          a.answer as string || "",
          a.question.topic || "General",
          a.question.concept || "General"
        );
        setAIMisconception(data.sessionId, a.id as string, data.studentId, analysis);
      }

      const updatedEvidence = getStudentEvidence(data.sessionId, data.studentId);
      const overview = getClassOverview(data.sessionId);
      const session = await import("./src/lib/db").then(m => {
        const d = m.getDb();
        return d.prepare("SELECT * FROM sessions WHERE id = ?").get(data.sessionId) as Record<string, unknown>;
      });

      io.to(data.sessionId).emit("analysis_complete", {
        studentId: data.studentId,
        evidence: updatedEvidence,
        overview,
        studentName: data.studentName,
      });
      io.to(data.sessionId).emit("session_updated", {
        ...session,
        students: evidence ? [evidence.student] : [],
        questions: [],
      });
    });

    socket.on("generate_adaptive_test", async (data: { sessionId: string; studentId: string; studentName: string }) => {
      const evidence = getStudentEvidence(data.sessionId, data.studentId);
      if (!evidence) return;

      const incorrectAnswers = evidence.answers
        .filter(a => !a.correct)
        .map(a => ({
          questionText: a.question?.text || "",
          studentAnswer: a.answer as string || "",
          correctAnswer: a.question?.answer || "",
          topic: a.question?.topic || "General",
          concept: a.question?.concept || "General",
        }));

      const result = await generateAdaptiveAssessment(
        data.studentName,
        evidence.weakConcepts,
        evidence.misconceptions,
        incorrectAnswers
      );

      const test = saveAdaptiveTest(data.sessionId, data.studentId, result);
      io.to(data.sessionId).emit("adaptive_test_generated", test);
    });

    socket.on("get_session", async (data: { code: string }) => {
      const session = getSessionByCode(data.code);
      if (session) {
        socket.join(session.id);
        socket.join(data.code.toUpperCase());
        socket.emit("session_data", session);
      } else {
        socket.emit("session_data", null);
      }
    });

    socket.on("get_session_by_id", async (data: { sessionId: string }) => {
      const session = await import("./src/lib/db").then(m => {
        const d = m.getDb();
        const s = d.prepare("SELECT * FROM sessions WHERE id = ?").get(data.sessionId) as Record<string, unknown> | undefined;
        if (!s) return null;
        const students = d.prepare("SELECT * FROM students WHERE session_id = ?").all(data.sessionId) as Record<string, unknown>[];
        const questions = d.prepare("SELECT * FROM questions WHERE session_id = ? ORDER BY sort_order").all(data.sessionId) as Record<string, unknown>[];
        return { ...s, students: students.map(st => ({ ...st })), questions: questions.map(q => ({ ...q, options: JSON.parse(q.options as string) })) };
      });
      socket.emit("session_data", session);
    });

    socket.on("get_evidence", async (data: { sessionId: string; studentId: string }) => {
      const ev = getStudentEvidence(data.sessionId, data.studentId);
      socket.emit("evidence_data", ev);
    });

    socket.on("get_overview", async (data: { sessionId: string }) => {
      const overview = getClassOverview(data.sessionId);
      socket.emit("overview_data", overview);
    });

    socket.on("get_adaptive_test", async (data: { sessionId: string; studentId: string }) => {
      const test = getAdaptiveTest(data.sessionId, data.studentId);
      socket.emit("adaptive_test_data", test);
    });

    socket.on("get_all_adaptive_tests", async (data: { sessionId: string }) => {
      const tests = getAllAdaptiveTests(data.sessionId);
      socket.emit("all_adaptive_tests_data", tests);
    });

    socket.on("disconnect", () => {
      console.log("[socket] disconnected:", socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Server ready on http://localhost:${PORT}`);
  });
});
