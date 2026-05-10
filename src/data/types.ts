export interface MultilingualText {
  uz: string
  ru: string
  en: string
}

export interface Question {
  q: MultilingualText
  options: { uz: string[], ru: string[], en: string[] }
  answer: number
}

export interface TestPart {
  id: number
  title: MultilingualText
  questions: Question[]
}

export interface PracticePhase {
  title: string
  duration: string
  durationMinutes: number
  description: string
  tools: string[]
}

export interface PracticeLabLang {
  objective: string
  groupTask: string
  conditions: string[]
  evaluationCriteria: string[]
  phases: PracticePhase[]
}

export interface PracticeLab {
  uz: PracticeLabLang
  ru: PracticeLabLang
  en: PracticeLabLang
}

export interface Topic {
  id: number
  title: MultilingualText
  description: MultilingualText
  theory: MultilingualText
  theoryImage: string
  practice: PracticeLab
  icon: string
  color: string
  testParts: TestPart[]
}
