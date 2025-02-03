// // Get book by ID
// router.get('/:id', async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.id);
//     if (!book) {
//       return res.status(404).json({ message: 'Book not found' });
//     }
//     res.json(book);
//   } catch (error) {
//     console.error('Error fetching book:', error);
//     res.status(500).json({ message: 'Error fetching book' });
//   }
// }); 