require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Instructor = require('../models/Instructor');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Review = require('../models/Review');
const Testimonial = require('../models/Testimonial');

/* ---------------- helpers ---------------- */
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const moduleTitlesByCategory = {
  'Design': [
    'Design Foundations', 'Visual Hierarchy & Layout', 'Color & Typography',
    'Components & Patterns', 'Prototyping & Handoff', 'Real-World Project'
  ],
  'Cyber Security': [
    'Security Fundamentals', 'Threats & Attack Vectors', 'Defense in Depth',
    'Hands-on Labs', 'Incident Response', 'Capstone Project'
  ],
  'Cloud Computing': [
    'Cloud Foundations', 'Compute & Storage', 'Networking & Security',
    'Automation & IaC', 'Monitoring & Cost', 'Real-World Deployment'
  ],
  'Front-end Development': [
    'Getting Started', 'Core Concepts', 'Building Components',
    'State & Data Flow', 'Performance & Testing', 'Capstone Project'
  ],
  'Back-end Development': [
    'Backend Foundations', 'APIs & Routing', 'Databases & Models',
    'Auth & Security', 'Scaling & Deployment', 'Capstone Project'
  ],
};

const lessonVerbs = ['Introduction to', 'Understanding', 'Working with', 'Hands-on:', 'Deep dive into', 'Project:'];

function buildModulesAndLessons(courseId, category) {
  const titles = moduleTitlesByCategory[category] || moduleTitlesByCategory['Design'];
  const modCount = rand(4, 6);
  const modules = [];
  const lessons = [];

  for (let m = 0; m < modCount; m++) {
    const moduleId = new mongoose.Types.ObjectId();
    modules.push({
      _id: moduleId,
      course: courseId,
      title: titles[m % titles.length],
      order: m,
    });

    const lessonCount = rand(4, 6);
    for (let l = 0; l < lessonCount; l++) {
      lessons.push({
        module: moduleId,
        title: `${pick(lessonVerbs)} ${titles[m % titles.length].toLowerCase()} — part ${l + 1}`,
        durationMinutes: rand(6, 18),
        order: l,
      });
    }
  }
  return { modules, lessons };
}

const reviewComments = [
  'Excellent course! The explanations are crystal clear and the projects are practical.',
  'Loved the pace and the depth. Definitely recommend it to anyone starting out.',
  'Instructor knows their stuff. The hands-on labs are gold.',
  'Great structure overall, though some sections could go deeper.',
  'Best course I\'ve taken on this platform — well worth the price.',
  'The real-world examples really helped me apply the concepts at work.',
  'Solid content, beautifully presented. Picked up a lot of new techniques.',
  'A bit fast for absolute beginners but very rewarding once you push through.',
  'Top tier. The capstone project alone makes it worth it.',
  'Very practical. I built things I can put in my portfolio.',
  'Well-organized, easy to follow. The instructor responds to questions too.',
  'Could use a few more exercises, but the lectures are excellent.',
  'I gained more clarity in 2 weeks than 6 months of self-study.',
  'Honest, modern, and to the point. No filler content.',
  'Engaging instructor and very up-to-date material. Highly recommend.',
];

function pickRating() {
  const r = Math.random();
  if (r < 0.55) return 5;
  if (r < 0.85) return 4;
  if (r < 0.95) return 3;
  return rand(1, 2);
}

/* ---------------- main seeder ---------------- */
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany(),
      Instructor.deleteMany(),
      Course.deleteMany(),
      Module.deleteMany(),
      Lesson.deleteMany(),
      Review.deleteMany(),
      Testimonial.deleteMany(),
    ]);

    /* ---------- Users ---------- */
    await User.create({
      firstName: 'Admin', lastName: 'Root',
      email: 'admin@edunova.com', password: 'admin123', role: 'admin',
    });

    await User.create({
      firstName: 'Demo', lastName: 'Learner',
      email: 'demo@edunova.com', password: 'demo12345', role: 'user',
      careerGoal: 'Advance in your field',
      interests: ['Front-end Development', 'Cloud Computer', 'Design'],
      city: 'Lagos', country: 'Nigeria',
      onboardingCompleted: true,
    });

    const instructorUsers = await User.create([
      { firstName: 'Alex', lastName: 'Jones', email: 'alex@edunova.com', password: 'alex12345', role: 'instructor' },
      { firstName: 'Sarah', lastName: 'Smith', email: 'sarah@edunova.com', password: 'sarah12345', role: 'instructor' },
      { firstName: 'Mia', lastName: 'Chen', email: 'mia@edunova.com', password: 'mia12345', role: 'instructor' },
      { firstName: 'David', lastName: 'Okafor', email: 'david@edunova.com', password: 'david12345', role: 'instructor' },
      { firstName: 'Priya', lastName: 'Raman', email: 'priya@edunova.com', password: 'priya12345', role: 'instructor' },
      { firstName: 'Lucas', lastName: 'Martin', email: 'lucas@edunova.com', password: 'lucas12345', role: 'instructor' },
    ]);

    // Reviewer pool — used to author reviews for every course
    const reviewerUsers = await User.create([
      { firstName: 'Emma', lastName: 'Williams', email: 'emma@edunova.com', password: 'pass12345', role: 'user' },
      { firstName: 'Noah', lastName: 'Garcia', email: 'noah@edunova.com', password: 'pass12345', role: 'user' },
      { firstName: 'Olivia', lastName: 'Brown', email: 'olivia@edunova.com', password: 'pass12345', role: 'user' },
      { firstName: 'Liam', lastName: 'Davis', email: 'liam@edunova.com', password: 'pass12345', role: 'user' },
      { firstName: 'Ava', lastName: 'Miller', email: 'ava@edunova.com', password: 'pass12345', role: 'user' },
      { firstName: 'Ethan', lastName: 'Wilson', email: 'ethan@edunova.com', password: 'pass12345', role: 'user' },
      { firstName: 'Sophia', lastName: 'Moore', email: 'sophia@edunova.com', password: 'pass12345', role: 'user' },
      { firstName: 'Mason', lastName: 'Taylor', email: 'mason@edunova.com', password: 'pass12345', role: 'user' },
    ]);

    /* ---------- Instructors ---------- */
    const [alex, sarah, mia, david, priya, lucas] = await Instructor.create([
      { user: instructorUsers[0]._id, name: 'Alex Jones', role: 'Cloud Engineer',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        bio: 'AWS-certified cloud engineer with 8+ years building production systems on AWS, Azure, and GCP.',
        rating: 4.8, coursesCount: 6 },
      { user: instructorUsers[1]._id, name: 'Sarah Smith', role: 'Senior React Engineer',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
        bio: 'Front-end specialist focused on React, TypeScript, and design systems. Previously at Vercel.',
        rating: 4.9, coursesCount: 6 },
      { user: instructorUsers[2]._id, name: 'Mia Chen', role: 'Product Designer',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956',
        bio: 'Product designer who has shipped at scale at Airbnb and Figma. Loves teaching the craft.',
        rating: 4.7, coursesCount: 7 },
      { user: instructorUsers[3]._id, name: 'David Okafor', role: 'Cyber Security Analyst',
        image: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1',
        bio: 'OSCP-certified pentester. Helping engineers build software that doesn\'t fall over to attacks.',
        rating: 4.6, coursesCount: 5 },
      { user: instructorUsers[4]._id, name: 'Priya Raman', role: 'Backend Engineer',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
        bio: 'Backend engineer specializing in Node.js, MongoDB, and high-throughput APIs.',
        rating: 4.8, coursesCount: 4 },
      { user: instructorUsers[5]._id, name: 'Lucas Martin', role: 'Full-Stack Engineer',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
        bio: 'Full-stack engineer who has scaled startups from 0 to millions of users.',
        rating: 4.7, coursesCount: 2 },
    ]);

    /* ---------- Course images ---------- */
    const img = {
      design: 'https://images.unsplash.com/photo-1561070791-2526d30994b8',
      designAlt: 'https://images.unsplash.com/photo-1503437313881-503a91226402',
      ux: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e',
      figma: 'https://images.unsplash.com/photo-1618004652321-13a63e576b80',
      security: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
      securityAlt: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3',
      cloud: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
      cloudAlt: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
      frontend: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
      frontendAlt: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      backend: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
      backendAlt: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479',
    };

    /* Helper to build a richer description */
    const longDesc = (short, audience) => `${short}

In this course you'll go beyond surface-level theory and actually build, ship, and reflect on real projects. Each section is structured to give you both the conceptual understanding and the practical skills you need to apply what you learn the same day.

${audience} You'll work through guided lessons, hands-on exercises, and a capstone project that ties everything together. By the end, you'll have not just knowledge, but evidence of your skills you can confidently put on your portfolio or CV.`;

    const courses = [
      // ===== Design =====
      { title: 'UI Design Fundamentals',
        description: longDesc('Master the principles of great user interface design from the ground up.',
          'Whether you\'re a complete beginner or a developer who wants to level up your visual eye, this course is designed for you.'),
        category: 'Design', topics: ['Design', 'Designer', 'UI'], level: 'Beginner',
        instructor: mia._id, price: 0, isFree: true, durationHours: 6, image: img.design },

      { title: 'Figma from Zero to Hero',
        description: longDesc('Learn Figma by designing real apps — from wireframes to interactive prototypes.',
          'Perfect for designers, developers, and PMs who want to communicate ideas visually with confidence.'),
        category: 'Design', topics: ['Design', 'Designer', 'Figma'], level: 'Beginner',
        instructor: mia._id, price: 3500, oldPrice: 6000, durationHours: 8, image: img.figma, isTrending: true },

      { title: 'UX Research & Usability Testing',
        description: longDesc('Plan and run user research, interviews, and usability tests like a pro.',
          'Built for designers and PMs who want to make decisions backed by real user evidence — not assumptions.'),
        category: 'Design', topics: ['Design', 'Designer', 'UX'], level: 'Intermediate',
        instructor: mia._id, price: 5500, oldPrice: 8500, durationHours: 10, image: img.ux },

      { title: 'Advanced Design Systems',
        description: longDesc('Scale design across large teams with tokens, components, and contribution models.',
          'For senior designers, design ops leads, and engineers building shared component libraries.'),
        category: 'Design', topics: ['Design', 'Designer', 'Design Systems'], level: 'Advanced',
        instructor: mia._id, price: 7000, oldPrice: 12000, durationHours: 12, image: img.designAlt },

      { title: 'Product Design Portfolio Masterclass',
        description: longDesc('Craft case studies that actually get you hired at top product teams.',
          'Designed for designers actively job-hunting or planning to switch into product design.'),
        category: 'Design', topics: ['Design', 'Designer', 'Portfolio'], level: 'Intermediate',
        instructor: mia._id, price: 4800, durationHours: 7, image: img.design },

      { title: 'Motion Design for Interfaces',
        description: longDesc('Add life to your UIs with timing, easing, and principled motion.',
          'Best for designers and front-end developers ready to ship more polished, professional UIs.'),
        category: 'Design', topics: ['Design', 'Designer', 'Motion'], level: 'Intermediate',
        instructor: mia._id, price: 6200, oldPrice: 9000, durationHours: 9, image: img.designAlt },

      { title: 'Typography in Digital Design',
        description: longDesc('Choose, pair, and tune type like a seasoned type designer.',
          'For designers and developers who want UIs that feel intentional and read beautifully on every screen.'),
        category: 'Design', topics: ['Design', 'Designer', 'Typography'], level: 'Beginner',
        instructor: mia._id, price: 0, isFree: true, durationHours: 4, image: img.design },

      // ===== Cyber Security =====
      { title: 'Cyber Security for Beginners',
        description: longDesc('Understand threats, defenses, and how to stay safe online.',
          'No prior tech background needed — perfect for IT folks and curious professionals starting out in security.'),
        category: 'Cyber Security', topics: ['Cyber Security', 'Security'], level: 'Beginner',
        instructor: david._id, price: 0, isFree: true, durationHours: 5, image: img.security },

      { title: 'Ethical Hacking & Penetration Testing',
        description: longDesc('Hands-on pentesting labs with real-world vulnerabilities.',
          'Aimed at aspiring red-teamers and security engineers ready for offensive security techniques.'),
        category: 'Cyber Security', topics: ['Cyber Security', 'Ethical Hacking'], level: 'Intermediate',
        instructor: david._id, price: 7500, oldPrice: 12000, durationHours: 14, image: img.securityAlt, isTrending: true },

      { title: 'Network Security Essentials',
        description: longDesc('Firewalls, VPNs, IDS/IPS, and securing enterprise networks.',
          'For IT admins, network engineers, and security analysts protecting real infrastructure.'),
        category: 'Cyber Security', topics: ['Cyber Security', 'Networking'], level: 'Intermediate',
        instructor: david._id, price: 5800, oldPrice: 9000, durationHours: 10, image: img.security },

      { title: 'Cloud Security on AWS',
        description: longDesc('IAM, KMS, GuardDuty, and zero-trust architectures on AWS.',
          'Designed for cloud and security engineers locking down AWS environments at scale.'),
        category: 'Cyber Security', topics: ['Cyber Security', 'Cloud', 'AWS'], level: 'Advanced',
        instructor: david._id, price: 9000, oldPrice: 14000, durationHours: 12, image: img.securityAlt },

      { title: 'Web Application Security (OWASP Top 10)',
        description: longDesc('Find and fix SQLi, XSS, CSRF, SSRF, and more in real apps.',
          'For full-stack engineers and security pros who want to ship software that doesn\'t fall over.'),
        category: 'Cyber Security', topics: ['Cyber Security', 'OWASP'], level: 'Advanced',
        instructor: david._id, price: 8200, durationHours: 11, image: img.security },

      // ===== Cloud Computing =====
      { title: 'Cloud Computing 101',
        description: longDesc('A gentle intro to cloud — what it is, why it matters, and where to start.',
          'Made for absolute beginners and career-switchers who want a clear, jargon-free start.'),
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'Cloud'], level: 'Beginner',
        instructor: alex._id, price: 0, isFree: true, durationHours: 4, image: img.cloud },

      { title: 'AWS Certified Solutions Architect Prep',
        description: longDesc('Everything you need to pass the AWS SAA-C03 exam with confidence.',
          'For developers and engineers preparing for the SAA-C03 cert and aiming for cloud architect roles.'),
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'AWS'], level: 'Intermediate',
        instructor: alex._id, price: 8500, oldPrice: 14000, durationHours: 20, image: img.cloudAlt, isTrending: true },

      { title: 'Azure Fundamentals (AZ-900)',
        description: longDesc('Master the core Azure services and pass AZ-900.',
          'For IT pros, devs, and managers who need a solid foundation in Microsoft Azure.'),
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'Azure'], level: 'Beginner',
        instructor: alex._id, price: 4500, oldPrice: 7000, durationHours: 7, image: img.cloud },

      { title: 'Kubernetes for Cloud Engineers',
        description: longDesc('Run, scale, and secure real workloads on Kubernetes.',
          'For DevOps and platform engineers ready to operate production-grade clusters.'),
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'Kubernetes'], level: 'Advanced',
        instructor: alex._id, price: 9500, oldPrice: 15000, durationHours: 16, image: img.cloudAlt },

      { title: 'Google Cloud Platform Deep Dive',
        description: longDesc('Compute, storage, BigQuery, and GKE on GCP.',
          'For cloud engineers who want to add Google Cloud to their skillset.'),
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'GCP'], level: 'Intermediate',
        instructor: alex._id, price: 6800, durationHours: 11, image: img.cloud },

      { title: 'Serverless Architectures with AWS Lambda',
        description: longDesc('Build event-driven, pay-per-request systems with Lambda + API Gateway.',
          'Designed for backend devs and architects ready to move past traditional servers.'),
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'Serverless'], level: 'Advanced',
        instructor: alex._id, price: 7200, oldPrice: 11000, durationHours: 9, image: img.cloudAlt },

      // ===== Front-end Development =====
      { title: 'HTML & CSS for Absolute Beginners',
        description: longDesc('Your first website, from zero coding experience to confidently styling pages.',
          'No coding background required — designed for total beginners and career-switchers.'),
        category: 'Front-end Development', topics: ['Front-end Development', 'HTML', 'CSS'], level: 'Beginner',
        instructor: sarah._id, price: 0, isFree: true, durationHours: 6, image: img.frontend },

      { title: 'JavaScript Essentials',
        description: longDesc('Modern JavaScript from syntax to async/await, with practical exercises.',
          'For HTML/CSS folks ready to add interactivity, and devs from other languages picking up JS.'),
        category: 'Front-end Development', topics: ['Front-end Development', 'JavaScript'], level: 'Beginner',
        instructor: sarah._id, price: 4200, oldPrice: 7000, durationHours: 9, image: img.frontendAlt },

      { title: 'React 19: The Complete Guide',
        description: longDesc('Components, hooks, Suspense, Server Components, and modern React patterns.',
          'For developers comfortable with JavaScript who want to master modern React the right way.'),
        category: 'Front-end Development', topics: ['Front-end Development', 'React'], level: 'Intermediate',
        instructor: sarah._id, price: 7000, oldPrice: 11000, durationHours: 15, image: img.frontend, isTrending: true },

      { title: 'Advanced React Patterns & Performance',
        description: longDesc('Memoization, concurrent features, profiling, and architectural patterns.',
          'For mid-level React devs ready to grow into senior engineers leading complex codebases.'),
        category: 'Front-end Development', topics: ['Front-end Development', 'React'], level: 'Advanced',
        instructor: sarah._id, price: 8500, oldPrice: 13000, durationHours: 12, image: img.frontendAlt },

      { title: 'TypeScript for React Developers',
        description: longDesc('Type your components, props, hooks, and reducers with confidence.',
          'For React devs who want to ship safer, more maintainable applications with TypeScript.'),
        category: 'Front-end Development', topics: ['Front-end Development', 'TypeScript'], level: 'Intermediate',
        instructor: sarah._id, price: 5200, durationHours: 8, image: img.frontend },

      { title: 'Tailwind CSS + Modern UI Building',
        description: longDesc('Ship beautiful responsive interfaces faster with Tailwind CSS.',
          'For developers who know HTML/CSS and want to build polished UIs at startup speed.'),
        category: 'Front-end Development', topics: ['Front-end Development', 'Tailwind'], level: 'Beginner',
        instructor: sarah._id, price: 3800, oldPrice: 6000, durationHours: 6, image: img.frontendAlt },

      // ===== Back-end Development =====
      { title: 'Node.js & Express from Scratch',
        description: longDesc('Build your first REST API with Node.js, Express, and MongoDB.',
          'For front-end devs and beginners ready to write their first backend.'),
        category: 'Back-end Development', topics: ['Back-end Development', 'Node.js', 'Express'], level: 'Beginner',
        instructor: priya._id, price: 0, isFree: true, durationHours: 8, image: img.backend },

      { title: 'REST API Design Best Practices',
        description: longDesc('Versioning, pagination, auth, errors, and documentation that scale.',
          'For backend developers who can build APIs and now want to design ones teams love to use.'),
        category: 'Back-end Development', topics: ['Back-end Development', 'API', 'REST'], level: 'Intermediate',
        instructor: priya._id, price: 4800, oldPrice: 7500, durationHours: 7, image: img.backendAlt },

      { title: 'MongoDB & Mongoose in Production',
        description: longDesc('Schema design, indexes, aggregations, and performance tuning.',
          'For Node.js developers who want to use MongoDB the right way in real production apps.'),
        category: 'Back-end Development', topics: ['Back-end Development', 'MongoDB'], level: 'Intermediate',
        instructor: priya._id, price: 5500, durationHours: 9, image: img.backend },

      { title: 'Advanced Backend Architecture (Microservices)',
        description: longDesc('Split monoliths into services, queues, and event-driven workflows.',
          'For senior backend engineers and tech leads designing systems that scale across teams.'),
        category: 'Back-end Development', topics: ['Back-end Development', 'Microservices'], level: 'Advanced',
        instructor: lucas._id, price: 9800, oldPrice: 15000, durationHours: 14, image: img.backendAlt, isTrending: true },

      { title: 'GraphQL APIs with Apollo',
        description: longDesc('Schema-first APIs, resolvers, subscriptions, and federation.',
          'For backend and full-stack devs ready to design APIs that clients actually love.'),
        category: 'Back-end Development', topics: ['Back-end Development', 'GraphQL'], level: 'Intermediate',
        instructor: lucas._id, price: 6200, oldPrice: 9500, durationHours: 10, image: img.backend },

      { title: 'SQL for Backend Engineers',
        description: longDesc('PostgreSQL from joins to window functions — with real-world exercises.',
          'For backend devs and analysts who want fluent SQL skills they can use every day.'),
        category: 'Back-end Development', topics: ['Back-end Development', 'SQL'], level: 'Beginner',
        instructor: priya._id, price: 4000, oldPrice: 6500, durationHours: 8, image: img.backendAlt },
    ];

    const normalized = courses.map((c) => ({
      institution: 'EduNova Academy',
      weeks: Math.max(2, Math.round((c.durationHours || 4) / 2)),
      hoursPerWeek: 4,
      studentsCount: rand(200, 4000),
      enrolledCount: rand(100, 3000),
      isPublished: true,
      ...c,
    }));

    const createdCourses = await Course.insertMany(normalized);
    console.log(`✅ ${createdCourses.length} courses inserted`);

    /* ---------- Modules + Lessons + Reviews per course ---------- */
    const allModules = [];
    const allLessons = [];
    const allReviews = [];

    for (const course of createdCourses) {
      // Modules + lessons
      const { modules, lessons } = buildModulesAndLessons(course._id, course.category);
      allModules.push(...modules);
      allLessons.push(...lessons);

      // Reviews — pick 5–8 unique reviewers per course
      const reviewerCount = rand(5, 8);
      const reviewers = shuffle(reviewerUsers).slice(0, reviewerCount);
      for (const reviewer of reviewers) {
        allReviews.push({
          user: reviewer._id,
          course: course._id,
          rating: pickRating(),
          comment: pick(reviewComments),
        });
      }
    }

    await Module.insertMany(allModules);
    await Lesson.insertMany(allLessons);
    await Review.insertMany(allReviews);
    console.log(`✅ ${allModules.length} modules, ${allLessons.length} lessons, ${allReviews.length} reviews seeded`);

    /* ---------- Recompute course stats from real data ---------- */
    for (const course of createdCourses) {
      const courseReviews = allReviews.filter((r) => String(r.course) === String(course._id));
      const courseModules = allModules.filter((m) => String(m.course) === String(course._id));

      const total = courseReviews.length;
      const avg = total ? courseReviews.reduce((s, r) => s + r.rating, 0) / total : 0;
      const liked = courseReviews.filter((r) => r.rating >= 4).length;
      const likedPercentage = total ? Math.round((liked / total) * 100) : 0;

      await Course.findByIdAndUpdate(course._id, {
        modulesCount: courseModules.length,
        rating: Math.round(avg * 10) / 10,
        reviewsCount: total,
        likedPercentage,
      });
    }
    console.log('✅ Course stats recomputed');

    /* ---------- Testimonials ---------- */
    await Testimonial.insertMany([
      { name: 'Briar Martin', handle: '@neilstellar',
        image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
        content: 'EduNova completely changed the way I learn!', approved: true },
      { name: 'Avery Johnson', handle: '@averywrites',
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
        content: 'The courses are top-notch and the instructors amazing.', approved: true },
    ]);

    console.log('🎉 Seed complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();