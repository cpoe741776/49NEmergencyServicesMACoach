// src/data/practices/foundations-resilience.ts

import type { SkillPractice } from "./types";

export const foundationsResiliencePractice: SkillPractice = {
  skillId: "foundations-resilience",
  title: "Foundations of Resilience Practice",
  description: "Build understanding of resilience through examples, self-reflection, and practical application to develop your mental armor foundation.",
  printTitle: "Mental Armor™ - Foundations of Resilience Practice Worksheet",
  totalTimeEstimate: "30-45 minutes",
  difficulty: "beginner",
  sections: [
    {
      id: "resilience-definition",
      title: "Step 1: Understanding Resilience",
      description: "Start by establishing your understanding of what resilience means and how it shows up in real life.",
      timeEstimate: "5 minutes",
      fields: [
        {
          id: "personal-definition",
          type: "textarea",
          label: "In your own words, how would you define resilience?",
          placeholder: "Think about what resilience means to you personally...",
          rows: 3,
          required: true,
          helpText: "Consider how you've seen resilience in your work or personal life"
        },
        {
          id: "resilience-examples",
          type: "textarea",
          label: "What are some examples of resilience you've observed?",
          placeholder: "Consider situations where you or others bounced back from challenges...",
          rows: 4,
          required: true
        }
      ]
    },
    {
      id: "resilience-attributes",
      title: "Step 2: Identifying Resilience Attributes",
      description: "Explore the key attributes that make someone resilient. Think about the characteristics that help people withstand, recover, and grow from adversity.",
      timeEstimate: "8 minutes",
      fields: [
        {
          id: "key-attributes",
          type: "textarea",
          label: "List 5-7 attributes you believe are most important for resilience",
          placeholder: "Examples: Adaptability, Optimism, Self-awareness, Social connection, Purpose...",
          rows: 4,
          required: true
        },
        {
          id: "attribute-ranking",
          type: "textarea",
          label: "Which 3 attributes from your list do you consider most critical? Why?",
          placeholder: "Rank your top 3 and explain why each is essential...",
          rows: 4,
          required: true
        }
      ]
    },
    {
      id: "historical-example",
      title: "Step 3: Historical Resilience Example",
      description: "Analyze a well-known figure who demonstrated resilience. This helps you see resilience attributes in action.",
      timeEstimate: "10 minutes",
      fields: [
        {
          id: "historical-figure",
          type: "text",
          label: "Choose a historical figure known for resilience",
          placeholder: "e.g., Nelson Mandela, Marie Curie, Frederick Douglass...",
          required: true
        },
        {
          id: "figure-challenges",
          type: "textarea",
          label: "What major challenges or adversities did this person face?",
          placeholder: "Describe the specific difficulties they encountered...",
          rows: 3,
          required: true
        },
        {
          id: "figure-responses",
          type: "textarea",
          label: "How did they respond to these challenges? What resilience attributes did they demonstrate?",
          placeholder: "Connect their actions to specific resilience characteristics...",
          rows: 4,
          required: true
        },
        {
          id: "figure-growth",
          type: "textarea",
          label: "How did they grow stronger or create positive change through their adversity?",
          placeholder: "What positive outcomes resulted from their resilient responses?",
          rows: 3,
          required: true
        }
      ]
    },
    {
      id: "personal-resilience",
      title: "Step 4: Personal Resilience Reflection",
      description: "Now examine your own resilience story. This helps you recognize the strengths you already possess.",
      timeEstimate: "12 minutes",
      fields: [
        {
          id: "personal-challenge",
          type: "textarea",
          label: "Describe a challenging situation you've faced in your personal or professional life",
          placeholder: "Choose a situation where you had to show resilience...",
          rows: 4,
          required: true
        },
        {
          id: "initial-reaction",
          type: "textarea",
          label: "What was your initial reaction to this challenge? How did you feel?",
          placeholder: "Be honest about your first thoughts and emotions...",
          rows: 3,
          required: true
        },
        {
          id: "coping-strategies",
          type: "textarea",
          label: "What specific actions did you take to handle this situation?",
          placeholder: "List the concrete steps you took to address the challenge...",
          rows: 4,
          required: true
        },
        {
          id: "support-systems",
          type: "textarea",
          label: "Who or what helped you through this difficult time?",
          placeholder: "Consider people, resources, beliefs, or practices that supported you...",
          rows: 3,
          required: true
        },
        {
          id: "lessons-learned",
          type: "textarea",
          label: "What did you learn about yourself from this experience?",
          placeholder: "Reflect on new insights about your capabilities and character...",
          rows: 4,
          required: true
        }
      ]
    },
    {
      id: "resilience-assessment",
      title: "Step 5: Current Resilience Assessment",
      description: "Honestly assess your current resilience strengths and areas for growth.",
      timeEstimate: "8 minutes",
      fields: [
        {
          id: "current-strengths",
          type: "textarea",
          label: "Based on your reflection, what are your current resilience strengths?",
          placeholder: "Which resilience attributes do you already demonstrate well?",
          rows: 4,
          required: true
        },
        {
          id: "growth-areas",
          type: "textarea",
          label: "What resilience attributes would you like to develop further?",
          placeholder: "Which areas could use strengthening to build your mental armor?",
          rows: 4,
          required: true
        },
        {
          id: "resilience-rating",
          type: "select",
          label: "Overall, how would you rate your current resilience level?",
          options: [
            "Still developing - I struggle with most challenges",
            "Building resilience - I handle some challenges well",
            "Moderately resilient - I bounce back from many difficulties",
            "Quite resilient - I recover well from most setbacks",
            "Highly resilient - I consistently grow stronger through adversity"
          ],
          required: true
        }
      ]
    },
    {
      id: "application-planning",
      title: "Step 6: Building Your Mental Armor Plan",
      description: "Create a specific plan for strengthening your resilience foundation using Mental Armor™ skills.",
      timeEstimate: "7 minutes",
      fields: [
        {
          id: "priority-skills",
          type: "multiselect",
          label: "Which Mental Armor™ skills do you want to focus on first?",
          options: [
            "Mindfulness",
            "Values-Based Living", 
            "ReFrame",
            "Cultivate Gratitude",
            "Spiritual Resilience",
            "Flex Your Strengths",
            "Balance Your Thinking",
            "What's Most Important",
            "Interpersonal Problem Solving",
            "Good Listening & Celebrate Good News"
          ],
          required: true,
          helpText: "Select 2-3 skills to focus on initially"
        },
        {
          id: "daily-practices",
          type: "textarea",
          label: "What daily or weekly practices will you commit to for building resilience?",
          placeholder: "Be specific about what you'll do and when...",
          rows: 4,
          required: true
        },
        {
          id: "accountability",
          type: "textarea",
          label: "How will you track your progress and stay accountable?",
          placeholder: "Consider journaling, check-ins with others, or specific metrics...",
          rows: 3,
          required: true
        },
        {
          id: "obstacle-planning",
          type: "textarea",
          label: "What obstacles might prevent you from practicing resilience skills, and how will you overcome them?",
          placeholder: "Anticipate challenges and plan solutions...",
          rows: 4,
          required: true
        }
      ]
    }
  ]
};