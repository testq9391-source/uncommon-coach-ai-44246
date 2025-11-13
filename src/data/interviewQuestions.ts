import { uxDesignBeginnerQuestions } from "./uxDesignQuestions";

// Warm-up questions to help interviewee feel comfortable
export const warmUpQuestions = [
  "Tell me about yourself and your professional background.",
  "What motivated you to apply for this position?",
  "What are you most passionate about in your career?",
];

// General questions that apply to all roles
export const generalQuestions = [
  "What are your salary expectations for this role?",
  "When would you be available to start if offered the position?",
  "Do you have any questions for us about the role or company?",
  "What are your long-term career goals?",
  "How do you handle work-life balance?",
];

// Role-specific question banks
export const questionsByRole: Record<string, string[]> = {
  'ux-design': uxDesignBeginnerQuestions.map(q => q.question),
  'graphic-design': [
    "What design software and tools are you most proficient in?",
    "Can you walk me through your creative process from brief to final design?",
    "How do you handle feedback and revisions from clients or stakeholders?",
    "Describe a project where you had to balance creativity with brand guidelines.",
    "How do you stay inspired and keep up with design trends?",
    "Tell me about a time you had to design under tight deadlines.",
    "What's your approach to creating designs for different mediums (print vs digital)?",
    "How do you ensure your designs are accessible and inclusive?",
  ],
  'software-dev': [
    "Can you walk me through your process for debugging a complex issue in a production environment?",
    "How do you stay updated with the latest technologies and best practices in your field?",
    "Describe a challenging project you've worked on and how you overcame the obstacles.",
    "What's your experience with version control systems like Git?",
    "How do you approach code reviews?",
    "Explain the difference between synchronous and asynchronous programming.",
    "What testing strategies do you use in your development process?",
    "How do you handle technical debt in a project?",
  ],
  'digital-marketing': [
    "How do you measure the success of a digital marketing campaign?",
    "Describe your experience with SEO and SEM strategies.",
    "What social media platforms do you have the most experience with?",
    "Tell me about a successful digital campaign you've led and the results achieved.",
    "How do you stay updated with the latest digital marketing trends and algorithm changes?",
    "What tools do you use for analytics and performance tracking?",
    "How do you approach audience segmentation and targeting?",
    "Describe your experience with email marketing and automation.",
  ],
};

// Shuffle array helper
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate interview questions based on role and difficulty
export const generateInterviewQuestions = (
  role: string,
  difficulty: string,
  numQuestions: number = 8
): string[] => {
  const roleQuestions = questionsByRole[role] || questionsByRole['software-dev'];
  
  // Always start with 1 warm-up question
  const selectedWarmUp = [warmUpQuestions[Math.floor(Math.random() * warmUpQuestions.length)]];
  
  // Calculate how many role-specific questions we need
  // Reserve 2 slots for general questions at the end
  const numRoleQuestions = Math.max(1, numQuestions - 3);
  
  // Shuffle and select role-specific questions
  const shuffledRoleQuestions = shuffleArray(roleQuestions);
  const selectedRoleQuestions = shuffledRoleQuestions.slice(0, numRoleQuestions);
  
  // Select 2 general questions
  const shuffledGeneralQuestions = shuffleArray(generalQuestions);
  const selectedGeneralQuestions = shuffledGeneralQuestions.slice(0, 2);
  
  // Combine: warm-up + role-specific + general
  return [
    ...selectedWarmUp,
    ...selectedRoleQuestions,
    ...selectedGeneralQuestions,
  ];
};