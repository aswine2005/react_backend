// const mongoose = require('mongoose');
// const Book = require('../models/book');
// require('dotenv').config();

// const comicBooks = [
//     {
//         id: 'marvel-001',
//         title: 'The Amazing Spider-Man: Coming Home',
//         author: 'J. Michael Straczynski',
//         description: 'Spider-Man faces one of his greatest challenges yet as he confronts a mysterious entity that forces him to question everything he knows about his origins.',
//         imageUrl: 'https://m.media-amazon.com/images/I/91D07epNE9L._AC_UF1000,1000_QL80_.jpg',
//         quantity: 10,
//         available: true,
//         rentPrice: 5.99,
//         category: 'Marvel Comics'
//     },
//     {
//         id: 'marvel-002',
//         title: 'X-Men: Dark Phoenix Saga',
//         author: 'Chris Claremont',
//         description: "One of the most popular X-Men stories of all time, showcasing Jean Grey's transformation into the Dark Phoenix.",
//         imageUrl: 'https://m.media-amazon.com/images/I/91grYqx0BVL._AC_UF1000,1000_QL80_.jpg',
//         quantity: 8,
//         available: true,
//         rentPrice: 6.99,
//         category: 'Marvel Comics'
//     },
//     {
//         id: 'dc-001',
//         title: 'Batman: The Killing Joke',
//         author: 'Alan Moore',
//         description: 'An unforgettable exploration of the Batman-Joker relationship, this graphic novel is considered one of the greatest Batman stories ever told.',
//         imageUrl: 'https://m.media-amazon.com/images/I/91KiX+EfDvL._AC_UF1000,1000_QL80_.jpg',
//         quantity: 12,
//         available: true,
//         rentPrice: 7.99,
//         category: 'DC Comics'
//     },
//     {
//         id: 'dc-002',
//         title: 'Superman: Red Son',
//         author: 'Mark Millar',
//         description: 'What if Superman had been raised in the Soviet Union? This fascinating alternate history explores that compelling premise.',
//         imageUrl: 'https://m.media-amazon.com/images/I/91nXyv5lGFL._AC_UF1000,1000_QL80_.jpg',
//         quantity: 7,
//         available: true,
//         rentPrice: 6.99,
//         category: 'DC Comics'
//     }
// ];

// const addComicBooks = async () => {
//     try {
//         await mongoose.connect(process.env.MONGODB_URI, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true
//         });
        
//         for (const book of comicBooks) {
//             await Book.findOneAndUpdate(
//                 { id: book.id },
//                 book,
//                 { upsert: true, new: true }
//             );
//             console.log(`Added/Updated book: ${book.title}`);
//         }
        
//         console.log('All comic books have been added successfully!');
//         process.exit(0);
//     } catch (error) {
//         console.error('Error adding comic books:', error);
//         process.exit(1);
//     }
// };

// addComicBooks();
