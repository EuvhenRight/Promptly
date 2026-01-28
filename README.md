# Promptly: AI Prompt Marketplace

Promptly is a marketplace for discovering, buying, and selling high-quality AI prompts. This project is built with Next.js, Firebase, and Tailwind CSS.

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- `npm` or `yarn`

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-folder>
```

### 2. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

### 3. Set Up Firebase

This project uses Firebase for authentication and database services. Each team member should use their own Firebase project for development to avoid conflicts.

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Add a Web App:** Inside your project, click the "Web" icon (`</>`) to add a new web application.
3.  **Get Config:** After creating the app, Firebase will provide you with a `firebaseConfig` object. Keep this page open.
4.  **Create Environment File:** In the root of your local project, copy the `.env` file to a new file named `.env.local`:

    ```bash
    cp .env .env.local
    ```

5.  **Add Your Config:** Open `.env.local` and replace the placeholder values with the actual values from your Firebase project's `firebaseConfig` object.

    ```env
    # .env.local
    NEXT_PUBLIC_FIREBASE_API_KEY="your-actual-api-key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-actual-auth-domain"
    # ...and so on for all the keys.
    ```

6.  **Enable Google Authentication:** In the Firebase Console, go to **Authentication** > **Sign-in method** and enable the **Google** provider.
7.  **Set Up Firestore:** In the Firebase Console, go to **Firestore Database** and create a new database. Start in **test mode** for now. The necessary security rules are already in the project (`firestore.rules`).

### 4. Run the Development Server

Once your environment variables are set, you can start the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Project Structure

-   `src/app/`: Contains all the pages and routes, following the Next.js App Router structure.
-   `src/components/`: Shared and reusable React components.
    -   `ui/`: Components from `shadcn/ui`.
    -   `layout/`: Global layout components like Header and Footer.
-   `src/lib/`: Utility functions, type definitions, and dummy data.
-   `src/firebase/`: All Firebase-related code, including initialization, hooks (`useUser`, `useDoc`), and helper functions.
-   `src/ai/`: Genkit flows for AI-powered features.
-   `docs/`: Backend schema definitions.
-   `public/`: Static assets like images and fonts.

## Database Schema

The application uses Firestore to store data. The current structure is as follows:

-   **/users/{userId}**:
    -   *Implicitly created when a user signs up. Stores user-specific data.*
    -   **Subcollections**:
        -   **/carts/{cartId}**: Stores the user's shopping cart.
            -   `id`: string
            -   `userId`: string
            -   `promptIds`: array of strings
            -   `createdAt`: timestamp
            -   `updatedAt`: timestamp
        -   **/orders/{orderId}**: Stores the user's past orders.
            -   `id`: string
            -   `userId`: string
            -   `promptIds`: array of strings
            -   `orderDate`: timestamp
            -   `totalAmount`: number
            -   `status`: string
