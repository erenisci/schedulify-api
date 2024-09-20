# Schedulify

## About

This project is a comprehensive task management system designed to help users organize and track their activities efficiently. Built with Node.js, Express, and MongoDB, this application features user authentication, activity tracking, and automated reminders.

## Features

- User registration and authentication
- Activity creation and management
- Automated resetting of completed activities
- RESTful API for easy integration and expansion

## Getting Started

To get a copy of this project up and running on your local machine for development and testing purposes, follow these steps:

### Prerequisites

- Node.js
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/erenisci/schedulify-api
   ```
2. Clone the repository:
   ```bash
   cd schedulify-api
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up your environment variables in a config.env file: [.env.example](./.env.example)
   &nbsp;
5. Start the application:
   ```bash
   npm run dev
   ```

## Important Note

After completing the necessary setup, users must manually set the role in the database to either "admin" or "super-admin" to test all APIs properly.

## Usage

Once the application is running, you can access it through http://localhost:[PORT]. Make sure to use the PORT specified in your config.env file. You can use tools like Postman to test the API endpoints.
