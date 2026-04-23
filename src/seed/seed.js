require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Instructor = require('../models/Instructor');
const Course = require('../models/Course');
const Testimonial = require('../models/Testimonial');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');

    await Promise.all([
      User.deleteMany(),
      Instructor.deleteMany(),
      Course.deleteMany(),
      Testimonial.deleteMany(),
    ]);

    const admin = await User.create({
      firstName: 'Admin', lastName: 'Root',
      email: 'admin@edunova.com', password: 'admin123', role: 'admin',
    });

    const alexUser = await User.create({
      firstName: 'Alex', lastName: 'Jones',
      email: 'alex@edunova.com', password: 'alex12345', role: 'instructor',
    });
    const sarahUser = await User.create({
      firstName: 'Sarah', lastName: 'Smith',
      email: 'sarah@edunova.com', password: 'sarah12345', role: 'instructor',
    });

    const alex = await Instructor.create({
      user: alexUser._id, name: 'Alex Jones', role: 'Cloud Engineer',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      rating: 4.8, coursesCount: 1,
    });
    const sarah = await Instructor.create({
      user: sarahUser._id, name: 'Sarah Smith', role: 'Senior React Engineer',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
      rating: 4.9, coursesCount: 1,
    });

    await Course.insertMany([
      {
        title: 'The Ultimate Beginners Guide to Cloud Computing',
        description: 'Learn AWS, Azure and GCP fundamentals.',
        category: 'Cloud', topics: ['Cloud'], level: 'Intermediate',
        instructor: alex._id, price: 5000, oldPrice: 8000, rating: 4.5,
        durationHours: 8, unitsCount: 12, modulesCount: 30, isTrending: true,
        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
      },
      {
        title: 'Advanced React Patterns and Best Practices',
        description: 'Hooks, context, performance tuning and more.',
        category: 'Development', topics: ['Development'], level: 'Advanced',
        instructor: sarah._id, price: 6000, oldPrice: 9000, rating: 4.8,
        durationHours: 10, unitsCount: 18, modulesCount: 56,
        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
      },
    ]);

    await Testimonial.insertMany([
      { name: 'Briar Martin', handle: '@neilstellar',
        image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
        content: 'EduNova completely changed the way I learn!', approved: true },
      { name: 'Avery Johnson', handle: '@averywrites',
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
        content: 'The courses are top-notch and the instructors amazing.', approved: true },
    ]);

    console.log('✅ Seed done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();