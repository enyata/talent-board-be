import { TalentProfileEntity } from "@src/entities/talentProfile.entity";
import { UserEntity } from "@src/entities/user.entity";
import { findBestMatch } from "string-similarity";

const canonicalSkills = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "C#",
  "C++",
  "Go",
  "Ruby",
  "HTML",
  "CSS",
  "SQL",
  "MongoDB",
  "PostgreSQL",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "DevOps",
  "Machine Learning",
  "Data Science",
];

export const normalizeSkills = (
  skills: string[],
  threshold = 0.85,
): string[] => {
  return skills.map((skill) => {
    const cleaned = skill.trim().toLocaleLowerCase();
    const match = findBestMatch(cleaned, canonicalSkills);
    return match.bestMatch.rating >= threshold
      ? match.bestMatch.target
      : cleaned;
  });
};

const experienceWeights: Record<string, number> = {
  entry: 1, // Low weight for entry level
  intermediate: 2, // Medium weight
  expert: 3, // Strongest influence
};

export const scoreTalentMatch = (
  talent: TalentProfileEntity,
  recruiter: UserEntity,
  recruiterSkills: string[],
): number => {
  const normalizedTalentSkills = normalizeSkills(talent.skills);

  const skillMatchCount =
    normalizedTalentSkills.filter((skill) => recruiterSkills.includes(skill))
      .length * 2;

  const experienceScore = experienceWeights[talent.experience_level] ?? 0;

  const locationBoost = talent.user.state === recruiter.state ? 1 : 0;

  return skillMatchCount + experienceScore + locationBoost;
};
