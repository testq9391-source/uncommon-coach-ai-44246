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
  'Software Development': [
    "Can you walk me through your process for debugging a complex issue in a production environment?",
    "How do you stay updated with the latest technologies and best practices in your field?",
    "Describe a challenging project you've worked on and how you overcame the obstacles.",
    "What's your experience with version control systems like Git?",
    "How do you approach code reviews?",
    "Explain the difference between synchronous and asynchronous programming.",
    "What testing strategies do you use in your development process?",
    "How do you handle technical debt in a project?",
  ],
  'Product Management': [
    "How do you prioritize features in a product roadmap?",
    "Describe your experience with agile methodologies.",
    "How do you gather and validate user requirements?",
    "Tell me about a time you had to make a difficult product decision.",
    "How do you measure product success?",
    "How do you handle stakeholder conflicts?",
    "What's your approach to competitive analysis?",
    "How do you balance technical constraints with user needs?",
  ],
  'Data Science': [
    "Explain your approach to exploratory data analysis.",
    "How do you handle missing or inconsistent data?",
    "Describe a machine learning project you've worked on.",
    "What's the difference between supervised and unsupervised learning?",
    "How do you evaluate the performance of a machine learning model?",
    "Tell me about a time you had to explain a complex analysis to non-technical stakeholders.",
    "What tools and technologies do you prefer for data analysis?",
    "How do you ensure the ethical use of data in your work?",
  ],
  'Marketing': [
    "How do you measure the success of a marketing campaign?",
    "Describe your experience with digital marketing channels.",
    "How do you identify and target your ideal customer?",
    "Tell me about a successful campaign you've led.",
    "How do you stay updated with marketing trends?",
    "What's your approach to brand positioning?",
    "How do you handle budget constraints in marketing?",
    "Describe your experience with marketing analytics tools.",
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
  const roleQuestions = questionsByRole[role] || questionsByRole['Software Development'];
  
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