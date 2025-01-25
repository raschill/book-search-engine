//import { useState, useEffect } from 'react';
import {useQuery, useMutation} from '@apollo/client';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';

//import { getMe, deleteBook } from '../utils/API';
//import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
//import type { User } from '../models/User';
import { GET_PLEASE } from '../utils/queries';
import { REMOVE_BOOK } from '../utils/mutations';

interface Book {
  bookId: string;
  authors: string[];
  description: string;
  title: string;
  image: string;
  link?: string;
}

interface UserData {
  _id: string;
  username: string;
  email: string;
  bookCount: number;
  savedBooks: Book[];
}

interface GetMeData {
  me: UserData;
}


const SavedBooks = () => {
  // Fetch user data on load using GET_PLEASE query
  const { loading, data } = useQuery<GetMeData>(GET_PLEASE);
  const [removeBook] = useMutation(REMOVE_BOOK);

  // Use optional chaining with userData for safety
  const userData = data?.me || { savedBooks: [] };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await removeBook({
        variables: { bookId },
        update: (cache) => {
          const { me } = cache.readQuery<GetMeData>({ query: GET_PLEASE }) || { me: { savedBooks: [] } };
          cache.writeQuery({
            query: GET_PLEASE,
            data: {
              me: {
                ...me,
                savedBooks: me.savedBooks.filter((book) => book.bookId !== bookId),
              },
            },
          });
        },
      });
      removeBookId(bookId);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <>
      <div className='text-light bg-dark p-5'>
        <Container>
          <h1>Viewing saved books!</h1>
        </Container>
      </div>
      <Container>
        <h2 className='pt-5'>
          {userData.savedBooks.length
            ? `Viewing ${userData.savedBooks.length} saved ${userData.savedBooks.length === 1 ? 'book' : 'books'}:`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {userData.savedBooks.map((book) => (
            <Col md="4" key={book.bookId}>
              <Card border='dark'>
                {book.image && <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className='small'>Authors: {book.authors.join(', ')}</p>
                  <Card.Text>{book.description}</Card.Text>
                  <Button className='btn-block btn-danger' onClick={() => handleDeleteBook(book.bookId)}>
                    Delete this Book!
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;