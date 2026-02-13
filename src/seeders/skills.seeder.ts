import { DataSource } from "typeorm";
import AppDataSource from "../datasource";
import { SkillEntity } from "../entities/skill.entity";
import log from "../utils/logger";

const SKILLS_LIST = [
  // Frontend
  "React",
  "Vue.js",
  "Angular",
  "Svelte",
  "Next.js",
  "Nuxt.js",
  "HTML",
  "CSS",
  "Sass",
  "Tailwind CSS",
  "Material UI",
  "Bootstrap",
  "JavaScript",
  "TypeScript",
  "jQuery",
  "Redux",
  "GraphQL",

  // Backend
  "Node.js",
  "Express.js",
  "NestJS",
  "Python",
  "Django",
  "Flask",
  "FastAPI",
  "Java",
  "Spring Boot",
  "C#",
  ".NET",
  "PHP",
  "Laravel",
  "Symfony",
  "Go",
  "Ruby",
  "Ruby on Rails",
  "Rust",

  // Database
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "SQLite",
  "MariaDB",
  "Firebase",
  "Supabase",
  "Prisma",
  "TypeORM",
  "Mongoose",

  // DevOps & Tools
  "Git",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "Jenkins",
  "GitHub Actions",
  "GitLab CI",
  "Linux",
  "Nginx",
  "Apache",

  // Mobile
  "React Native",
  "Flutter",
  "Swift",
  "Kotlin",
  "Dart",
  "Ionic",

  // Design
  "Figma",
  "Adobe XD",
  "Sketch",
  "Photoshop",
  "Illustrator",
  "Canva",
  "InVision",

  // Product Management
  "Jira",
  "Trello",
  "Asana",
  "Scrum",
  "Kanban",
  "Agile",
  "Product Roadmap",
  "User Research",

  // Data Science & Analysis
  "Python (Data Science)",
  "R",
  "Pandas",
  "NumPy",
  "Tableau",
  "Power BI",
  "SQL",
  "Machine Learning",
  "Data Analysis",

  // Marketing & Content
  "SEO",
  "Content Writing",
  "Copywriting",
  "Social Media Marketing",
  "Google Analytics",
  "Email Marketing",
  "Blogging",
  "WordPress",

  // Virtual Assistant
  "Data Entry",
  "Email Management",
  "Calendar Management",
  "Research",
  "Transcription",
  "Customer Service",
  "Microsoft Office",
  "Google Workspace",
  "Zoom",
  "Slack",
  "Time Management",

  // Customer Support
  "Zendesk",
  "Intercom",
  "Freshdesk",
  "Communication",
  "Problem Solving",

  // Sales
  "Salesforce",
  "HubSpot",
  "Lead Generation",
  "Cold Calling",
  "Negotiation",
];

export const seedSkills = async (dataSource: DataSource) => {
  log.info("Seeding skills...");
  const skillRepo = dataSource.getRepository(SkillEntity);

  let newlyCreated = 0;

  for (const name of SKILLS_LIST) {
    const exists = await skillRepo.findOne({
      where: { name: name },
    });

    if (!exists) {
      const existingCaseInsensitive = await skillRepo
        .createQueryBuilder("skill")
        .where("LOWER(skill.name) = LOWER(:name)", { name })
        .getOne();

      if (!existingCaseInsensitive) {
        await skillRepo.save(skillRepo.create({ name }));
        newlyCreated++;
      }
    }
  }

  log.info(`Skills seeding complete. Created ${newlyCreated} new skills.`);
};

if (require.main === module) {
  AppDataSource.initialize()
    .then(async (dataSource) => {
      await seedSkills(dataSource);
      await dataSource.destroy();
    })
    .catch((error) => console.error("Skills seeding failed:", error));
}
