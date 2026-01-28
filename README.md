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

### 3. Set Up a Shared Firebase Project

This project uses a single, shared Firebase project for the entire team to ensure everyone is working with the same data and authentication setup.

#### For the Project Owner (One-Time Setup)

If you are the one who created the Firebase project, you need to add your teammates as members.

1.  Go to your [Firebase Console](https://console.firebase.google.com/).
2.  Select your project.
3.  Click the gear icon next to "Project Overview" and select **Users and permissions**.
4.  Click **Add member** and enter the Google account email addresses of your teammates.
5.  Assign them the **Editor** role. This gives them the necessary permissions to manage Firebase services.

#### For All Team Members (Including the Owner)

Once you have access to the shared project, follow these steps to get your local environment running.

1.  **Select the Project:** Go to the [Firebase Console](https://console.firebase.google.com/). You should see the shared project on your list. Select it.
2.  **Get Firebase Config:**
    *   Click the gear icon next to "Project Overview" and select **Project settings**.
    *   In the "Your apps" card, select the web app for this project.
    *   In the "Firebase SDK snippet" section, choose the **Config** option. This will show you the `firebaseConfig` object.
3.  **Create Environment File:** In the root of your local project, if you don't already have one, copy the `.env` file to a new file named `.env.local`:

    ```bash
    cp .env .env.local
    ```

4.  **Add Shared Config:** Open `.env.local` and replace the placeholder values with the actual values from the shared project's `firebaseConfig` object. **Everyone on the team will use the same values.**

    ```env
    # .env.local
    NEXT_PUBLIC_FIREBASE_API_KEY="your-shared-api-key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-shared-auth-domain"
    # ...and so on for all the keys.
    ```

#### First-Time Project Configuration (If Not Already Done)

The following steps only need to be done once for the entire project. Confirm with your team if this is already completed.

1.  **Enable Google Authentication:** In the shared project's Firebase Console, go to **Authentication** > **Sign-in method** and enable the **Google** provider.
2.  **Set Up Firestore:** In the shared project's Firebase Console, go to **Firestore Database** and create a new database. Start in **test mode** for now. The necessary security rules are already in the project (`firestore.rules`).

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
