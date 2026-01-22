# Socially

A social media platform built with the MERN stack (MongoDB, Express, React, Node.js). You can view the live demo at [socially-sm.netlify.app](https://socially-sm.netlify.app).

## Features

- **Registration and Login System**: Secure user authentication.
- **Email Verification**: Users can verify their accounts through email and URL.
- **Password Reset**: Reset your password with a secure process.
- **Following Accounts**: Follow other users and view their posts.
- **Posting Text, Images, and Videos**: Share posts with multimedia support.
- **Sharing Posts**: Repost content from other users.
- **Saving Posts**: Save posts for later viewing.
- **Commenting and Replying**: Engage with posts through comments and replies.
- **Liking Posts, Comments, and Replies**: Interact by liking posts and comments.
- **Notifications**: Receive real-time notifications for all interactions.
- **Real-Time Messaging**: Includes features like:
  - User activity status (online, last seen)
  - Message status (sent, delivered, seen)
- **Responsive Design**: Works smoothly across all devices.
- **High Performance**: Optimized for fast loading and performance.
- **File Compression**: Automatically compresses uploaded files.
- **Light and Dark Themes**: Users can switch between light and dark modes.

## Preview

Here are some screenshots of the app in action:

<img src="assets/preview-1.png" alt="preview-1"  style="border-radius:8px;width:30%;display:inline-block">
<img src="assets/preview-2.png" alt="preview-2" style="border-radius:8px;width:100%;display:inline-block">
<img src="assets/preview-3.png" alt="preview-3"style="border-radius:8px;width:30%;display:inline-block" >
<img src="assets/preview-4.png" alt="preview-4"style="border-radius:8px;width:30%;display:inline-block" >
<img src="assets/preview-5.png" alt="preview-5"style="border-radius:8px;width:30%;display:inline-block" >

## Getting Started

### Prerequisites

To run this project locally, you will need:

- MongoDB Database (Local or MongoDB Atlas)
- A Gmail account to send emails via a third-party service

### Installation

Follow these steps to set up the project:

1. **Clone the repository:**

   ```bash
   $ git clone https://github.com/eyadbenaamer/Socially
   $ cd Socially
   ```

2. **Set up environment variables:**

   You will need to create `.env` files in both the `client` and `server` directories.
   - **Client `.env` (located in `/client/.env`):**

     ```env
     VITE_APP_URL=http://localhost:5000
     ```

   - **Server `.env` (located in `/server/.env`):**

     ```env
     APP_URL=http://localhost:5173
     API_URL=http://localhost:5000
     GMAIL_USER=<your Gmail>
     GMAIL_PASSWORD=<your email password>
     COOKIE_SECRET=<your cookie secret key>
     JWT_SECRET=<your JWT secret key>
     MONGO_URI=<your MongoDB URL>
     PORT=5000
     TOKEN_EXPIRATION=10d
     PEXELS_API_KEY=<your Pexels API key>
     ```

   > **Note:** To get a Pexels API key, visit [Pexels API](https://www.pexels.com/api/) and sign up for a free account. The API key is used for generating contextual images in the seed script.

3. **Install dependencies:**

   Open two terminal windows or tabs:
   - In the first terminal, navigate to the client directory, install dependencies, and start the client:

     ```bash
     $ cd client
     $ npm i --force
     $ npm start
     ```

   - In the second terminal, navigate to the server directory, install dependencies, and start the server:

     ```bash
     $ cd server
     $ npm i
     $ npm start
     ```

4. **Seed the database (optional):**

To populate the database with sample data, run the seed script. You can run it directly with `node` or via `npm` using the added `seed` script.

Basic usage:

```bash
$ cd server
$ node utils/seed.js
# or using npm
$ npm run seed
```

CLI options

- `-u, --users <number>` — number of users to create (default: 10)
- `-p, --max-posts <number>` — max posts per user (default: 20)
- `-f, --max-followers <number>` — max followers per user (default: 100)
- `--password <password>` — password for created users (default: "password")
- `-h, --help` — show usage

Example:

```bash
# create 50 users, max 10 posts per user, up to 200 followers
$ node utils/seed.js --users 50 --max-posts 10 --max-followers 200
```

The script will create sample users, posts, and relationships. It uses the Pexels API to generate contextual images for posts (set `PEXELS_API_KEY` in `/server/.env`).

5. **Reindex Elasticsearch profiles (optional):**


    If you need to rebuild the Elasticsearch `profiles` index (for example after schema changes), run the reindex script from the `server` folder.

    ```bash
    $ cd server
    $ node utils/reindexProfiles.js
    # or using npm
    $ npm run reindex
    ```

    Notes:
    - The script reads Elasticsearch configuration from environment variables (`ELASTIC_PROTOCOL`, `ELASTIC_HOST`, `ELASTIC_PORT`, `ELASTIC_USERNAME`, `ELASTIC_PASSWORD`, `ELASTICSEARCH_CA_PATH`).
    - You can supply a local `MONGO_URI` via `/server/.env` or rely on the default `mongodb://127.0.0.1:27017/socially` for local testing.
    - Use `ELASTIC_PROTOCOL=https` and set `ELASTICSEARCH_CA_PATH` when connecting to a secured Elasticsearch cluster.

### Usage

Once both the client and server are running, the application should be available at:

- **Client (Frontend):** `http://localhost:5173`
- **Server (Backend):** `http://localhost:5000`

You can now use the app locally.

### Live Demo

Check out the live version of the app at [socially-sm.netlify.app](https://socially-sm.netlify.app).

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
