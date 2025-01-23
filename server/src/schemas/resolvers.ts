import {UserInputError} from 'apollo-server-express';
import User from '../models/User.js';
import {signToken, AuthenticationError} from '../services/auth.js';

interface BookInput {
    bookId: string;
    authors?: string[];
    description?: string;
    title: string;
    image?: string;
    link?: string;
}

export const resolvers= {
    Query: {
        me: async (_: unknown, context: any) => {
            const {user}= context;
            if (!user) {
                throw new AuthenticationError('Not authenticated');
            }
            return await User.findById(user._id);
        },
        getAllUsers: async () => {
            return await User.find();
        },
    },

    Mutation: {
        login: async (
            _: unknown,
            {email, password}: {email: string; password: string}
        ) => {
            const user= await User.findOne({email});
            if (!user) {
                throw new AuthenticationError("Can't find this user; try again.");
            }

            const correctPw= await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('That password is incorrect');
            }

            const token= signToken(user.username, user.email, user._id);
            return {token, user};
        },

        addUser: async (
            _: unknown,
            {username, email, password}: {username: string; email: string; password: string}
        ) => {
            const user= await User.create({username, email, password});
            if (!user) {
                throw new UserInputError('There was an error creating user');
            }

            const token= signToken(user.username, user.email, user._id);
            return {token, user};
        },

        saveBook: async (
            _: unknown,
            {bookData}: {bookData: BookInput},
            context: any
        ) => {
            const {user}= context;
            if(!user) {
                throw new AuthenticationError('Error during authentication');
            }

            const userUpdate= await User.findByIdAndUpdate(
                user._id,
                {$addToSet: {savedBooks: bookData} },
                {new: true, runValidators: true}
            );
            return userUpdate;
        },

        removeBook: async (
            _: unknown,
            {bookId}: {bookId: string},
            context: any
        ) => {
            const {user}= context;
            if (!user) {
                throw new AuthenticationError('Error authenticating');
            }

            const userUpdate= await User.findByIdAndUpdate(
                user._id,
                {$pull: {savedBooks: {bookId} } },
                {new: true}
            );
            if (!userUpdate) {
                throw new UserInputError("Could not find a user with that ID");
            }
            return userUpdate;
        },
    },
};