require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Instructor = require('../models/Instructor');
const Course = require('../models/Course');
const Testimonial = require('../models/Testimonial');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany(),
      Instructor.deleteMany(),
      Course.deleteMany(),
      Testimonial.deleteMany(),
    ]);

    // ---------- Users ----------
    await User.create({
      firstName: 'Admin', lastName: 'Root',
      email: 'admin@edunova.com', password: 'admin123', role: 'admin',
    });

    // A pre-onboarded demo user you can log in as to immediately see "Picked for you"
    await User.create({
      firstName: 'Demo', lastName: 'Learner',
      email: 'demo@edunova.com', password: 'demo12345', role: 'user',
      careerGoal: 'Advance in your field',
      interests: ['Front-end Development', 'Cloud Computer', 'Design'],
      city: 'Lagos', country: 'Nigeria',
      onboardingCompleted: true,
    });

    const instructorUsers = await User.create([
      { firstName: 'Alex',  lastName: 'Jones',  email: 'alex@edunova.com',  password: 'alex12345',  role: 'instructor' },
      { firstName: 'Sarah', lastName: 'Smith',  email: 'sarah@edunova.com', password: 'sarah12345', role: 'instructor' },
      { firstName: 'Mia',   lastName: 'Chen',   email: 'mia@edunova.com',   password: 'mia12345',   role: 'instructor' },
      { firstName: 'David', lastName: 'Okafor', email: 'david@edunova.com', password: 'david12345', role: 'instructor' },
      { firstName: 'Priya', lastName: 'Raman',  email: 'priya@edunova.com', password: 'priya12345', role: 'instructor' },
      { firstName: 'Lucas', lastName: 'Martin', email: 'lucas@edunova.com', password: 'lucas12345', role: 'instructor' },
    ]);

    // ---------- Instructors ----------
    const [alex, sarah, mia, david, priya, lucas] = await Instructor.create([
      { user: instructorUsers[0]._id, name: 'Alex Jones',   role: 'Cloud Engineer',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', rating: 4.8, coursesCount: 6 },
      { user: instructorUsers[1]._id, name: 'Sarah Smith',  role: 'Senior React Engineer',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2', rating: 4.9, coursesCount: 6 },
      { user: instructorUsers[2]._id, name: 'Mia Chen',     role: 'Product Designer',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956', rating: 4.7, coursesCount: 7 },
      { user: instructorUsers[3]._id, name: 'David Okafor', role: 'Cyber Security Analyst',
        image: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1', rating: 4.6, coursesCount: 5 },
      { user: instructorUsers[4]._id, name: 'Priya Raman',  role: 'Backend Engineer',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', rating: 4.8, coursesCount: 4 },
      { user: instructorUsers[5]._id, name: 'Lucas Martin', role: 'Full-Stack Engineer',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', rating: 4.7, coursesCount: 2 },
    ]);

    // ---------- Courses ----------
    const img = {
      design:     'https://images.unsplash.com/photo-1561070791-2526d30994b8',
      designAlt:  'https://images.unsplash.com/photo-1503437313881-503a91226402',
      ux:         'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e',
      figma:      'https://images.unsplash.com/photo-1618004652321-13a63e576b80',
      security:   'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
      securityAlt:'https://images.unsplash.com/photo-1563013544-824ae1b704d3',
      cloud:      'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
      cloudAlt:   'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
      frontend:   'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
      frontendAlt:'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      backend:    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
      backendAlt: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479',
    };

    // NOTE: topics include the *exact* onboarding strings so the regex
    // match in /courses/recommended works regardless of the "Cloud Computer" typo.
    const courses = [
      // ===== Design / Designer =====
      { title: 'UI Design Fundamentals',
        description: 'Master the principles of great user interface design from the ground up.',
        category: 'Design', topics: ['Design', 'Designer', 'UI'], level: 'Beginner',
        instructor: mia._id, price: 0, isFree: true, rating: 4.6,
        durationHours: 6, unitsCount: 10, modulesCount: 24, image: img.design,
        whatYouWillLearn: ['Color theory', 'Typography', 'Layout', 'Design systems'] },

      { title: 'Figma from Zero to Hero',
        description: 'Learn Figma by designing real apps — from wireframes to interactive prototypes.',
        category: 'Design', topics: ['Design', 'Designer', 'Figma'], level: 'Beginner',
        instructor: mia._id, price: 3500, oldPrice: 6000, rating: 4.8,
        durationHours: 8, unitsCount: 14, modulesCount: 36, image: img.figma, isTrending: true },

      { title: 'UX Research & Usability Testing',
        description: 'Plan and run user research, interviews, and usability tests like a pro.',
        category: 'Design', topics: ['Design', 'Designer', 'UX'], level: 'Intermediate',
        instructor: mia._id, price: 5500, oldPrice: 8500, rating: 4.7,
        durationHours: 10, unitsCount: 16, modulesCount: 42, image: img.ux },

      { title: 'Advanced Design Systems',
        description: 'Scale design across large teams with tokens, components, and contribution models.',
        category: 'Design', topics: ['Design', 'Designer', 'Design Systems'], level: 'Advanced',
        instructor: mia._id, price: 7000, oldPrice: 12000, rating: 4.9,
        durationHours: 12, unitsCount: 20, modulesCount: 55, image: img.designAlt },

      { title: 'Product Design Portfolio Masterclass',
        description: 'Craft case studies that actually get you hired at top product teams.',
        category: 'Design', topics: ['Design', 'Designer', 'Portfolio'], level: 'Intermediate',
        instructor: mia._id, price: 4800, rating: 4.5,
        durationHours: 7, unitsCount: 12, modulesCount: 28, image: img.design },

      { title: 'Motion Design for Interfaces',
        description: 'Add life to your UIs with timing, easing, and principled motion.',
        category: 'Design', topics: ['Design', 'Designer', 'Motion'], level: 'Intermediate',
        instructor: mia._id, price: 6200, oldPrice: 9000, rating: 4.6,
        durationHours: 9, unitsCount: 14, modulesCount: 32, image: img.designAlt },

      { title: 'Typography in Digital Design',
        description: 'Choose, pair, and tune type like a seasoned type designer.',
        category: 'Design', topics: ['Design', 'Designer', 'Typography'], level: 'Beginner',
        instructor: mia._id, price: 0, isFree: true, rating: 4.4,
        durationHours: 4, unitsCount: 8, modulesCount: 18, image: img.design },

      // ===== Cyber Security =====
      { title: 'Cyber Security for Beginners',
        description: 'Understand threats, defenses, and how to stay safe online.',
        category: 'Cyber Security', topics: ['Cyber Security', 'Security'], level: 'Beginner',
        instructor: david._id, price: 0, isFree: true, rating: 4.5,
        durationHours: 5, unitsCount: 10, modulesCount: 22, image: img.security },

      { title: 'Ethical Hacking & Penetration Testing',
        description: 'Hands-on pentesting labs with real-world vulnerabilities.',
        category: 'Cyber Security', topics: ['Cyber Security', 'Ethical Hacking'], level: 'Intermediate',
        instructor: david._id, price: 7500, oldPrice: 12000, rating: 4.9,
        durationHours: 14, unitsCount: 22, modulesCount: 64, image: img.securityAlt, isTrending: true },

      { title: 'Network Security Essentials',
        description: 'Firewalls, VPNs, IDS/IPS, and securing enterprise networks.',
        category: 'Cyber Security', topics: ['Cyber Security', 'Networking'], level: 'Intermediate',
        instructor: david._id, price: 5800, oldPrice: 9000, rating: 4.6,
        durationHours: 10, unitsCount: 16, modulesCount: 40, image: img.security },

      { title: 'Cloud Security on AWS',
        description: 'IAM, KMS, GuardDuty, and zero-trust architectures on AWS.',
        category: 'Cyber Security', topics: ['Cyber Security', 'Cloud', 'AWS'], level: 'Advanced',
        instructor: david._id, price: 9000, oldPrice: 14000, rating: 4.8,
        durationHours: 12, unitsCount: 18, modulesCount: 48, image: img.securityAlt },

      { title: 'Web Application Security (OWASP Top 10)',
        description: 'Find and fix SQLi, XSS, CSRF, SSRF, and more in real apps.',
        category: 'Cyber Security', topics: ['Cyber Security', 'OWASP'], level: 'Advanced',
        instructor: david._id, price: 8200, rating: 4.7,
        durationHours: 11, unitsCount: 17, modulesCount: 44, image: img.security },

      // ===== Cloud Computer / Cloud Computing =====
      { title: 'Cloud Computing 101',
        description: 'A gentle intro to cloud — what it is, why it matters, and where to start.',
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'Cloud'], level: 'Beginner',
        instructor: alex._id, price: 0, isFree: true, rating: 4.4,
        durationHours: 4, unitsCount: 8, modulesCount: 20, image: img.cloud },

      { title: 'AWS Certified Solutions Architect Prep',
        description: 'Everything you need to pass the AWS SAA-C03 exam with confidence.',
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'AWS'], level: 'Intermediate',
        instructor: alex._id, price: 8500, oldPrice: 14000, rating: 4.9,
        durationHours: 20, unitsCount: 28, modulesCount: 80, image: img.cloudAlt, isTrending: true },

      { title: 'Azure Fundamentals (AZ-900)',
        description: 'Master the core Azure services and pass AZ-900.',
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'Azure'], level: 'Beginner',
        instructor: alex._id, price: 4500, oldPrice: 7000, rating: 4.7,
        durationHours: 7, unitsCount: 12, modulesCount: 30, image: img.cloud },

      { title: 'Kubernetes for Cloud Engineers',
        description: 'Run, scale, and secure real workloads on Kubernetes.',
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'Kubernetes'], level: 'Advanced',
        instructor: alex._id, price: 9500, oldPrice: 15000, rating: 4.8,
        durationHours: 16, unitsCount: 22, modulesCount: 60, image: img.cloudAlt },

      { title: 'Google Cloud Platform Deep Dive',
        description: 'Compute, storage, BigQuery, and GKE on GCP.',
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'GCP'], level: 'Intermediate',
        instructor: alex._id, price: 6800, rating: 4.6,
        durationHours: 11, unitsCount: 16, modulesCount: 42, image: img.cloud },

      { title: 'Serverless Architectures with AWS Lambda',
        description: 'Build event-driven, pay-per-request systems with Lambda + API Gateway.',
        category: 'Cloud Computing', topics: ['Cloud Computing', 'Cloud Computer', 'Serverless'], level: 'Advanced',
        instructor: alex._id, price: 7200, oldPrice: 11000, rating: 4.7,
        durationHours: 9, unitsCount: 14, modulesCount: 36, image: img.cloudAlt },

      // ===== Front-end Development =====
      { title: 'HTML & CSS for Absolute Beginners',
        description: 'Your first website, from zero coding experience to confidently styling pages.',
        category: 'Front-end Development', topics: ['Front-end Development', 'HTML', 'CSS'], level: 'Beginner',
        instructor: sarah._id, price: 0, isFree: true, rating: 4.6,
        durationHours: 6, unitsCount: 12, modulesCount: 28, image: img.frontend },

      { title: 'JavaScript Essentials',
        description: 'Modern JavaScript from syntax to async/await, with practical exercises.',
        category: 'Front-end Development', topics: ['Front-end Development', 'JavaScript'], level: 'Beginner',
        instructor: sarah._id, price: 4200, oldPrice: 7000, rating: 4.7,
        durationHours: 9, unitsCount: 15, modulesCount: 38, image: img.frontendAlt },

      { title: 'React 19: The Complete Guide',
        description: 'Components, hooks, Suspense, Server Components, and modern React patterns.',
        category: 'Front-end Development', topics: ['Front-end Development', 'React'], level: 'Intermediate',
        instructor: sarah._id, price: 7000, oldPrice: 11000, rating: 4.9,
        durationHours: 15, unitsCount: 22, modulesCount: 58, image: img.frontend, isTrending: true },

      { title: 'Advanced React Patterns & Performance',
        description: 'Memoization, concurrent features, profiling, and architectural patterns.',
        category: 'Front-end Development', topics: ['Front-end Development', 'React'], level: 'Advanced',
        instructor: sarah._id, price: 8500, oldPrice: 13000, rating: 4.8,
        durationHours: 12, unitsCount: 18, modulesCount: 48, image: img.frontendAlt },

      { title: 'TypeScript for React Developers',
        description: 'Type your components, props, hooks, and reducers with confidence.',
        category: 'Front-end Development', topics: ['Front-end Development', 'TypeScript'], level: 'Intermediate',
        instructor: sarah._id, price: 5200, rating: 4.7,
        durationHours: 8, unitsCount: 14, modulesCount: 34, image: img.frontend },

      { title: 'Tailwind CSS + Modern UI Building',
        description: 'Ship beautiful responsive interfaces faster with Tailwind CSS.',
        category: 'Front-end Development', topics: ['Front-end Development', 'Tailwind'], level: 'Beginner',
        instructor: sarah._id, price: 3800, oldPrice: 6000, rating: 4.6,
        durationHours: 6, unitsCount: 10, modulesCount: 24, image: img.frontendAlt },

      // ===== Back-end Development =====
      { title: 'Node.js & Express from Scratch',
        description: 'Build your first REST API with Node.js, Express, and MongoDB.',
        category: 'Back-end Development', topics: ['Back-end Development', 'Node.js', 'Express'], level: 'Beginner',
        instructor: priya._id, price: 0, isFree: true, rating: 4.7,
        durationHours: 8, unitsCount: 14, modulesCount: 34, image: img.backend },

      { title: 'REST API Design Best Practices',
        description: 'Versioning, pagination, auth, errors, and documentation that scale.',
        category: 'Back-end Development', topics: ['Back-end Development', 'API', 'REST'], level: 'Intermediate',
        instructor: priya._id, price: 4800, oldPrice: 7500, rating: 4.6,
        durationHours: 7, unitsCount: 12, modulesCount: 28, image: img.backendAlt },

      { title: 'MongoDB & Mongoose in Production',
        description: 'Schema design, indexes, aggregations, and performance tuning.',
        category: 'Back-end Development', topics: ['Back-end Development', 'MongoDB'], level: 'Intermediate',
        instructor: priya._id, price: 5500, rating: 4.7,
        durationHours: 9, unitsCount: 14, modulesCount: 36, image: img.backend },

      { title: 'Advanced Backend Architecture (Microservices)',
        description: 'Split monoliths into services, queues, and event-driven workflows.',
        category: 'Back-end Development', topics: ['Back-end Development', 'Microservices'], level: 'Advanced',
        instructor: lucas._id, price: 9800, oldPrice: 15000, rating: 4.8,
        durationHours: 14, unitsCount: 20, modulesCount: 52, image: img.backendAlt, isTrending: true },

      { title: 'GraphQL APIs with Apollo',
        description: 'Schema-first APIs, resolvers, subscriptions, and federation.',
        category: 'Back-end Development', topics: ['Back-end Development', 'GraphQL'], level: 'Intermediate',
        instructor: lucas._id, price: 6200, oldPrice: 9500, rating: 4.6,
        durationHours: 10, unitsCount: 15, modulesCount: 40, image: img.backend },

      { title: 'SQL for Backend Engineers',
        description: 'PostgreSQL from joins to window functions — with real-world exercises.',
        category: 'Back-end Development', topics: ['Back-end Development', 'SQL'], level: 'Beginner',
        instructor: priya._id, price: 4000, oldPrice: 6500, rating: 4.5,
        durationHours: 8, unitsCount: 13, modulesCount: 30, image: img.backendAlt },
    ];

    // Normalize extra fields + social-proof numbers
    const normalized = courses.map(c => ({
      institution: 'EduNova Academy',
      weeks: Math.max(2, Math.round((c.durationHours || 4) / 2)),
      hoursPerWeek: 4,
      studentsCount: Math.floor(200 + Math.random() * 4000),
      enrolledCount: Math.floor(100 + Math.random() * 3000),
      reviewsCount: Math.floor(20 + Math.random() * 400),
      likedPercentage: Math.floor(85 + Math.random() * 15),
      isPublished: true,
      ...c,
    }));

    await Course.insertMany(normalized);

    // ---------- Testimonials ----------
    await Testimonial.insertMany([
      { name: 'Briar Martin', handle: '@neilstellar',
        image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
        content: 'EduNova completely changed the way I learn!', approved: true },
      { name: 'Avery Johnson', handle: '@averywrites',
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
        content: 'The courses are top-notch and the instructors amazing.', approved: true },
    ]);

    console.log(`✅ Seed done — ${normalized.length} courses across all onboarding interests`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();