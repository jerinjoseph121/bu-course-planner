import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TERM = "Fall 2026";

type SectionSeed = {
  sectionCode: string;
  type: string;
  instructor?: string;
  location?: string;
  days: string;
  startTime: string;
  endTime: string;
};

type CourseSeed = {
  code: string;
  subjectCode: string;
  courseNumber: string;
  title: string;
  description: string;
  school: string;
  department: string;
  credits: number;
  level: "Undergraduate" | "Graduate";
  hubUnits?: string;
  sections: SectionSeed[];
};

const CAS = "College of Arts & Sciences";
const QST = "Questrom School of Business";
const ENG = "College of Engineering";

const courses: CourseSeed[] = [
  // ---- CAS CS: Computer Science ----
  {
    code: "CAS CS 111",
    subjectCode: "CAS CS",
    courseNumber: "111",
    title: "Introduction to Computer Science 1",
    description:
      "First course in the introductory sequence. Covers problem solving, algorithms, and programming fundamentals using a modern high-level language.",
    school: CAS,
    department: "Computer Science",
    credits: 4,
    level: "Undergraduate",
    hubUnits: "Quantitative Reasoning I",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. A. Rivera", location: "CAS 313", days: "MO,WE,FR", startTime: "09:05", endTime: "09:55" },
    ],
  },
  {
    code: "CAS CS 112",
    subjectCode: "CAS CS",
    courseNumber: "112",
    title: "Introduction to Computer Science 2",
    description:
      "Continuation of CAS CS 111. Data structures, recursion, and object-oriented design, with an introduction to algorithm analysis.",
    school: CAS,
    department: "Computer Science",
    credits: 4,
    level: "Undergraduate",
    hubUnits: "Quantitative Reasoning II",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. A. Rivera", location: "CAS 313", days: "MO,WE,FR", startTime: "10:10", endTime: "11:00" },
    ],
  },
  {
    code: "CAS CS 210",
    subjectCode: "CAS CS",
    courseNumber: "210",
    title: "Computer Systems",
    description:
      "Introduction to computer organization, the C programming language, memory management, and the Unix programming environment.",
    school: CAS,
    department: "Computer Science",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "B1", type: "Lecture", instructor: "Prof. K. Chen", location: "CAS 315", days: "TU,TH", startTime: "11:00", endTime: "12:15" },
    ],
  },
  {
    code: "CAS CS 350",
    subjectCode: "CAS CS",
    courseNumber: "350",
    title: "Fundamentals of Computing Systems",
    description:
      "Operating systems concepts including processes, threads, synchronization, memory management, and file systems.",
    school: CAS,
    department: "Computer Science",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. M. Osei", location: "CAS 325", days: "MO,WE,FR", startTime: "13:25", endTime: "14:15" },
    ],
  },
  {
    code: "CAS CS 411",
    subjectCode: "CAS CS",
    courseNumber: "411",
    title: "Design and Analysis of Algorithms",
    description:
      "Techniques for designing and analyzing efficient algorithms: divide and conquer, dynamic programming, greedy methods, and graph algorithms.",
    school: CAS,
    department: "Computer Science",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. L. Nguyen", location: "CAS 213", days: "TU,TH", startTime: "09:30", endTime: "10:45" },
    ],
  },
  {
    code: "CAS CS 501",
    subjectCode: "CAS CS",
    courseNumber: "501",
    title: "CS Practicum",
    description:
      "Supervised, project-based practicum for graduate students. Students work in teams on an applied software project with faculty mentorship.",
    school: CAS,
    department: "Computer Science",
    credits: 4,
    level: "Graduate",
    sections: [
      { sectionCode: "A1", type: "Practicum", instructor: "Prof. D. Whitcomb", location: "CAS 214", days: "TU", startTime: "18:30", endTime: "21:15" },
    ],
  },
  {
    code: "CAS CS 542",
    subjectCode: "CAS CS",
    courseNumber: "542",
    title: "Machine Learning",
    description:
      "Graduate introduction to machine learning: supervised and unsupervised learning, neural networks, and model evaluation.",
    school: CAS,
    department: "Computer Science",
    credits: 4,
    level: "Graduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. S. Park", location: "CAS 224", days: "MO,WE", startTime: "15:35", endTime: "16:50" },
    ],
  },
  {
    code: "CAS CS 598",
    subjectCode: "CAS CS",
    courseNumber: "598",
    title: "Advanced Topics in Computer Science: Distributed Systems",
    description:
      "Graduate seminar covering advanced topics in distributed systems: consensus protocols, replication, fault tolerance, and distributed storage.",
    school: CAS,
    department: "Computer Science",
    credits: 4,
    level: "Graduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. R. Holloway", location: "750 Commonwealth Ave EPC 209", days: "TU,TH", startTime: "14:00", endTime: "15:15" },
      { sectionCode: "A2", type: "Discussion", instructor: "Prof. R. Holloway", location: "685-725 Comm Ave CAS 225", days: "MO", startTime: "12:20", endTime: "13:10" },
    ],
  },

  // ---- CAS MA: Mathematics ----
  {
    code: "CAS MA 123",
    subjectCode: "CAS MA",
    courseNumber: "123",
    title: "Calculus 1",
    description: "Limits, derivatives, and an introduction to integration, with applications.",
    school: CAS,
    department: "Mathematics",
    credits: 4,
    level: "Undergraduate",
    hubUnits: "Quantitative Reasoning I",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. I. Watanabe", location: "CAS 201", days: "MO,WE,FR", startTime: "08:00", endTime: "08:50" },
    ],
  },
  {
    code: "CAS MA 124",
    subjectCode: "CAS MA",
    courseNumber: "124",
    title: "Calculus 2",
    description: "Techniques of integration, sequences and series, and an introduction to differential equations.",
    school: CAS,
    department: "Mathematics",
    credits: 4,
    level: "Undergraduate",
    hubUnits: "Quantitative Reasoning II",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. I. Watanabe", location: "CAS 201", days: "MO,WE,FR", startTime: "09:05", endTime: "09:55" },
    ],
  },
  {
    code: "CAS MA 225",
    subjectCode: "CAS MA",
    courseNumber: "225",
    title: "Multivariate Calculus",
    description: "Vectors, partial derivatives, multiple integrals, and vector calculus.",
    school: CAS,
    department: "Mathematics",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "B1", type: "Lecture", instructor: "Prof. H. Douglas", location: "CAS 201", days: "TU,TH", startTime: "12:30", endTime: "13:45" },
    ],
  },
  {
    code: "CAS MA 242",
    subjectCode: "CAS MA",
    courseNumber: "242",
    title: "Linear Algebra",
    description: "Vector spaces, linear transformations, eigenvalues and eigenvectors, and applications.",
    school: CAS,
    department: "Mathematics",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. H. Douglas", location: "CAS 203", days: "MO,WE,FR", startTime: "11:15", endTime: "12:05" },
    ],
  },
  {
    code: "CAS MA 293",
    subjectCode: "CAS MA",
    courseNumber: "293",
    title: "Discrete Mathematics",
    description: "Logic, set theory, combinatorics, and graph theory for computer science and mathematics majors.",
    school: CAS,
    department: "Mathematics",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. Y. Okafor", location: "CAS 203", days: "TU,TH", startTime: "09:30", endTime: "10:45" },
    ],
  },
  {
    code: "CAS MA 581",
    subjectCode: "CAS MA",
    courseNumber: "581",
    title: "Probability",
    description: "Graduate-level introduction to probability theory: distributions, expectation, and limit theorems.",
    school: CAS,
    department: "Mathematics",
    credits: 4,
    level: "Graduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. Y. Okafor", location: "CAS 522", days: "MO", startTime: "16:00", endTime: "18:45" },
    ],
  },

  // ---- CAS WR: Writing Program ----
  {
    code: "CAS WR 98",
    subjectCode: "CAS WR",
    courseNumber: "98",
    title: "Introductory College Writing",
    description: "Preparatory writing course focused on essay structure, revision, and academic argument.",
    school: CAS,
    department: "Writing Program",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "C1", type: "Discussion", instructor: "Prof. E. Marsh", location: "CAS 132", days: "MO,WE,FR", startTime: "10:10", endTime: "11:00" },
    ],
  },
  {
    code: "CAS WR 100",
    subjectCode: "CAS WR",
    courseNumber: "100",
    title: "Writing Seminar",
    description: "First-year writing seminar emphasizing research, argument, and revision across academic genres.",
    school: CAS,
    department: "Writing Program",
    credits: 4,
    level: "Undergraduate",
    hubUnits: "First-Year Writing Seminar",
    sections: [
      { sectionCode: "D1", type: "Discussion", instructor: "Prof. J. Alcaraz", location: "CAS 132", days: "TU,TH", startTime: "12:30", endTime: "13:45" },
    ],
  },
  {
    code: "CAS WR 150",
    subjectCode: "CAS WR",
    courseNumber: "150",
    title: "Writing, Research & Inquiry",
    description: "Research-driven writing seminar on a topical theme, culminating in an original research project.",
    school: CAS,
    department: "Writing Program",
    credits: 4,
    level: "Undergraduate",
    hubUnits: "Writing, Research & Inquiry",
    sections: [
      { sectionCode: "E1", type: "Discussion", instructor: "Prof. J. Alcaraz", location: "CAS 134", days: "MO,WE", startTime: "14:30", endTime: "15:45" },
    ],
  },

  // ---- CAS EC: Economics ----
  {
    code: "CAS EC 101",
    subjectCode: "CAS EC",
    courseNumber: "101",
    title: "Introductory Microeconomics",
    description: "Supply and demand, consumer and firm behavior, and market structures.",
    school: CAS,
    department: "Economics",
    credits: 4,
    level: "Undergraduate",
    hubUnits: "Social Inquiry I",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. N. Fitzgerald", location: "CAS B12", days: "MO,WE,FR", startTime: "10:10", endTime: "11:00" },
    ],
  },
  {
    code: "CAS EC 102",
    subjectCode: "CAS EC",
    courseNumber: "102",
    title: "Introductory Macroeconomics",
    description: "National income, unemployment, inflation, and monetary and fiscal policy.",
    school: CAS,
    department: "Economics",
    credits: 4,
    level: "Undergraduate",
    hubUnits: "Social Inquiry I",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. N. Fitzgerald", location: "CAS B12", days: "MO,WE,FR", startTime: "11:15", endTime: "12:05" },
    ],
  },
  {
    code: "CAS EC 201",
    subjectCode: "CAS EC",
    courseNumber: "201",
    title: "Intermediate Microeconomic Theory",
    description: "Consumer and producer theory, market equilibrium, and welfare analysis at an intermediate level.",
    school: CAS,
    department: "Economics",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "B1", type: "Lecture", instructor: "Prof. P. Anand", location: "CAS 224", days: "TU,TH", startTime: "09:30", endTime: "10:45" },
    ],
  },
  {
    code: "CAS EC 366",
    subjectCode: "CAS EC",
    courseNumber: "366",
    title: "Money and Banking",
    description: "The role of money, banks, and central banks in the economy, including monetary policy transmission.",
    school: CAS,
    department: "Economics",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. P. Anand", location: "CAS 224", days: "TU,TH", startTime: "14:00", endTime: "15:15" },
    ],
  },

  // ---- QST: Questrom School of Business ----
  {
    code: "QST SM 131",
    subjectCode: "QST SM",
    courseNumber: "131",
    title: "Career and Professional Development",
    description: "Foundational seminar on career planning, professional communication, and the Questrom recruiting process.",
    school: QST,
    department: "Strategy & Innovation",
    credits: 1,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Seminar", instructor: "Prof. C. Ibarra", location: "QST 233", days: "WE", startTime: "09:00", endTime: "09:50" },
    ],
  },
  {
    code: "QST AC 221",
    subjectCode: "QST AC",
    courseNumber: "221",
    title: "Introduction to Financial Accounting",
    description: "Principles of financial accounting: the accounting cycle, financial statements, and reporting standards.",
    school: QST,
    department: "Accounting",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. G. Levesque", location: "QST 203", days: "MO,WE,FR", startTime: "11:15", endTime: "12:05" },
    ],
  },
  {
    code: "QST FE 323",
    subjectCode: "QST FE",
    courseNumber: "323",
    title: "Introduction to Finance",
    description: "Time value of money, valuation of stocks and bonds, capital budgeting, and risk and return.",
    school: QST,
    department: "Finance",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "B1", type: "Lecture", instructor: "Prof. T. Okonjo", location: "QST 306", days: "TU,TH", startTime: "12:30", endTime: "13:45" },
    ],
  },
  {
    code: "QST SI 421",
    subjectCode: "QST SI",
    courseNumber: "421",
    title: "Innovation and Design Fundamentals",
    description: "Human-centered design methods applied to new venture and product development.",
    school: QST,
    department: "Strategy & Innovation",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. C. Ibarra", location: "QST 313", days: "MO,WE", startTime: "15:35", endTime: "16:50" },
    ],
  },

  // ---- ENG: College of Engineering ----
  {
    code: "ENG EK 127",
    subjectCode: "ENG EK",
    courseNumber: "127",
    title: "Innovation and Design in Engineering",
    description: "First-year engineering design course covering the design process, prototyping, and teamwork.",
    school: ENG,
    department: "Engineering",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. B. Sokolov", location: "ENG 118", days: "MO,WE,FR", startTime: "09:05", endTime: "09:55" },
    ],
  },
  {
    code: "ENG EK 307",
    subjectCode: "ENG EK",
    courseNumber: "307",
    title: "Signals and Systems",
    description: "Continuous and discrete-time signals and systems, convolution, and Fourier analysis.",
    school: ENG,
    department: "Electrical & Computer Engineering",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. V. Petrova", location: "ENG 210", days: "TU,TH", startTime: "11:00", endTime: "12:15" },
    ],
  },
  {
    code: "ENG EC 327",
    subjectCode: "ENG EC",
    courseNumber: "327",
    title: "Foundations of Computer Systems",
    description: "Computer organization, assembly language, and the hardware/software interface for engineers.",
    school: ENG,
    department: "Electrical & Computer Engineering",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. V. Petrova", location: "ENG 213", days: "MO,WE,FR", startTime: "13:25", endTime: "14:15" },
    ],
  },
  {
    code: "ENG ME 302",
    subjectCode: "ENG ME",
    courseNumber: "302",
    title: "Mechanics of Materials",
    description: "Stress, strain, and deformation of engineering materials under axial, torsional, and bending loads.",
    school: ENG,
    department: "Mechanical Engineering",
    credits: 4,
    level: "Undergraduate",
    sections: [
      { sectionCode: "A1", type: "Lecture", instructor: "Prof. F. Delacroix", location: "ENG 213", days: "TU,TH", startTime: "09:30", endTime: "10:45" },
    ],
  },
];

async function main() {
  console.log("Seeding courses...");

  const sectionByKey = new Map<string, string>(); // "code|sectionCode" -> section.id

  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {
        subjectCode: c.subjectCode,
        courseNumber: c.courseNumber,
        title: c.title,
        description: c.description,
        school: c.school,
        department: c.department,
        credits: c.credits,
        level: c.level,
        hubUnits: c.hubUnits,
      },
      create: {
        code: c.code,
        subjectCode: c.subjectCode,
        courseNumber: c.courseNumber,
        title: c.title,
        description: c.description,
        school: c.school,
        department: c.department,
        credits: c.credits,
        level: c.level,
        hubUnits: c.hubUnits,
      },
    });

    for (const s of c.sections) {
      const existing = await prisma.section.findFirst({
        where: { courseId: course.id, sectionCode: s.sectionCode, term: TERM },
      });
      const section = existing
        ? await prisma.section.update({
            where: { id: existing.id },
            data: { ...s, term: TERM },
          })
        : await prisma.section.create({
            data: { ...s, term: TERM, courseId: course.id },
          });
      sectionByKey.set(`${c.code}|${s.sectionCode}`, section.id);
    }
  }

  console.log(`Seeded ${courses.length} courses.`);

  // ---- Default Fall 2026 schedule, derived from the student's own calendar export ----
  console.log("Seeding default Fall 2026 schedule...");

  await prisma.scheduleItem.deleteMany({ where: { term: TERM } });

  const cs598Lecture = sectionByKey.get("CAS CS 598|A1")!;
  const cs598Discussion = sectionByKey.get("CAS CS 598|A2")!;
  const cs501Practicum = sectionByKey.get("CAS CS 501|A1")!;

  await prisma.scheduleItem.createMany({
    data: [
      {
        term: TERM,
        kind: "class",
        sectionId: cs598Discussion,
        courseCode: "CAS CS 598",
        title: "Advanced Topics in Computer Science: Distributed Systems",
        type: "Discussion",
        instructor: "Prof. R. Holloway",
        location: "685-725 Comm Ave CAS 225",
        days: "MO",
        startTime: "12:20",
        endTime: "13:10",
      },
      {
        term: TERM,
        kind: "class",
        sectionId: cs598Lecture,
        courseCode: "CAS CS 598",
        title: "Advanced Topics in Computer Science: Distributed Systems",
        type: "Lecture",
        instructor: "Prof. R. Holloway",
        location: "750 Commonwealth Ave EPC 209",
        days: "TU,TH",
        startTime: "14:00",
        endTime: "15:15",
      },
      {
        term: TERM,
        kind: "class",
        sectionId: cs501Practicum,
        courseCode: "CAS CS 501",
        title: "CS Practicum",
        type: "Practicum",
        instructor: "Prof. D. Whitcomb",
        location: "685-725 Comm Ave CAS 214",
        days: "TU",
        startTime: "18:30",
        endTime: "21:15",
      },
      {
        term: TERM,
        kind: "exam",
        sectionId: null,
        courseCode: "CAS CS 501",
        title: "CS Practicum — Final Exam",
        type: "Exam",
        instructor: null,
        location: "685-725 Comm Ave CAS 214",
        days: "",
        startTime: "20:00",
        endTime: "20:00",
        examDate: "2026-12-15",
        notes:
          "Placeholder slot exported from the registrar calendar (start = end time). Confirm the exact exam time with the instructor.",
      },
    ],
  });

  console.log("Default schedule seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
