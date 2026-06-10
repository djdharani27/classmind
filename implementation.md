# Adaptive Classroom AI

Build a complete MVP using Next.js 15, TypeScript, TailwindCSS, shadcn/ui, OpenRouter API, and NVIDIA Nemotron 3 Nano Omni 30B A3B Reasoning (free).

## Core Idea

Teachers conduct assessments.

Students join a live session.

AI analyzes every student's strengths and weaknesses.

The next assessment is automatically personalized for each student.

No authentication.

No database setup complexity.

Everything should work from a single browser session using in-memory storage.

---

# User Roles

## Teacher

Teacher enters:

* Name
* Create Session button

System generates:

SESSION CODE

Example:

ABC123

Teacher sees:

* Session code
* Number of students joined
* Start Test button
* Live dashboard

---

## Student

Student enters:

* Name
* Session Code

Clicks Join.

Student waits in lobby until teacher starts.

---

# Flow

## Step 1

Teacher creates a session.

Example:

Math and Science Diagnostic Test

20 questions.

Teacher clicks Start Test.

---

## Step 2

Students answer questions.

Questions can be:

* Multiple Choice
* Short Answer

Timer:

10 minutes

---

## Step 3

After submission AI performs analysis.

For every question determine:

* Correct or Incorrect
* Topic
* Difficulty
* Concept tested

Example:

Question:
15 × 12

Concept:
Multiplication

Topic:
Arithmetic

Difficulty:
Easy

Result:
Incorrect

---

## Step 4

Build Student Knowledge Profile

Example:

{
"student":"John",
"arithmetic":45,
"fractions":20,
"algebra":75,
"geometry":90,
"biology":50,
"physics":30
}

Store profiles in memory.

---

## Step 5

Teacher Dashboard

Show:

Class Average

Topic Mastery Heatmap

Weakest Topics

Strongest Topics

Student Rankings

Learning Gaps

Visual charts.

---

## Step 6

Generate Personalized Test

Teacher clicks:

Generate Adaptive Test

For each student:

Weak topics receive more questions.

Strong topics receive fewer questions.

Example:

Student A

Algebra 20%

Fractions 30%

Geometry 90%

Adaptive Test:

50% Algebra

30% Fractions

20% Geometry

Every student receives a unique paper.

---

# AI Features

Use OpenRouter.

Model:

nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free

Prompt:

Analyze student answers.

Return JSON:

{
"topic_scores":{},
"strengths":[],
"weaknesses":[],
"recommended_focus":[]
}

Generate personalized questions based on weaknesses.

Return valid JSON only.

---

# Pages

/

Role selection

/teacher

Teacher dashboard

/student

Student dashboard

/session/[code]

Live classroom

/results

Analytics page

---

# UI Requirements

Modern hackathon quality.

Dark mode.

Gradient hero.

Cards.

Charts.

Animations.

Real-time updates.

Mobile responsive.

Professional SaaS appearance.

---

# Demo Data

Preload 5 fake students.

Preload test results.

Allow instant demo without multiple devices.

---

# Judging Demo Script

Teacher creates class.

5 students join.

Teacher starts assessment.

Students answer.

AI analyzes.

Dashboard updates.

Teacher clicks Generate Adaptive Test.

Each student receives a different test.

Show knowledge profile.

Show learning gaps.

Show personalized learning path.

This should feel like Khan Academy meets Duolingo meets Classroom Analytics.

Focus on the wow factor and hackathon demo quality over production readiness.
