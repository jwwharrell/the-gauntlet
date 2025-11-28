# The Gauntlet

A web application that allows users to search for music albums, add them to a personal ranking list, and reorder them according to preference.

## Overview

This project is an album ranker application built with React, TypeScript, and AWS Amplify. It provides a user-friendly interface for music enthusiasts to create and manage personalized album rankings.

## Features

- **Album Search**: Search for albums by name or artist using the MusicBrainz API
- **Album Ranking**: Add albums to your personal ranking, drag and drop to reorder, and remove albums as needed
- **Data Persistence**: Rankings are stored in DynamoDB through AWS Amplify
- **Authentication**: Setup with Amazon Cognito for secure user authentication
- **API**: Ready-to-use GraphQL endpoint with AWS AppSync
- **Database**: Real-time database powered by Amazon DynamoDB

## Project Architecture

The application is built on a React+Vite foundation with TypeScript, integrated with AWS Amplify for backend services. It follows a modern frontend architecture with component-based design.

### Key Technologies

- **Frontend**: React 18 with TypeScript, built using Vite
- **Backend**: AWS Amplify providing:
  - Authentication (Amazon Cognito)
  - API (AWS AppSync GraphQL)
  - Database (Amazon DynamoDB)
- **External APIs**:
  - MusicBrainz API for album metadata (supports both general and specific album/artist queries)
  - Cover Art Archive API for album artwork

## Key Components

- **AlbumSearch**: Handles searching for albums via the MusicBrainz API with pagination
- **AlbumRanking**: Manages the display and interaction with the ranked albums list
- **App**: Main component that coordinates the application state and user interactions

## Data Flow

1. User searches for albums using the search component
2. Results are fetched from MusicBrainz API and displayed
3. When a user selects an album, it's added to their ranking list
4. Album data is stored in AWS DynamoDB through Amplify's data API
5. Users can reorder their rankings through drag-and-drop, with changes persisted to the database

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- AWS account (for Amplify backend)
- AWS Amplify CLI (for backend deployment)

### Running Locally

1. Clone the repository
   ```
   git clone https://github.com/jwwharrell/the-gauntlet.git
   cd the-gauntlet
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up the Amplify backend
   ```
   npm install -g @aws-amplify/cli
   amplify configure  # Follow the prompts to configure your AWS credentials
   amplify init       # Initialize the Amplify project
   amplify push       # Deploy the backend resources to AWS
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Development Workflow

- Make changes to the React components in the `src` directory
- The development server will automatically reload when you save changes
- To lint your code, run:
  ```
  npm run lint
  ```
- To build for production:
  ```
  npm run build
  ```
- To preview the production build:
  ```
  npm run preview
  ```

### AWS Amplify Configuration

This project uses AWS Amplify Gen 2 with the following configuration:

- **Authentication**: Email-based authentication using Amazon Cognito
- **Data Storage**: Album data stored in DynamoDB with the following schema:
  - title (string)
  - artist (string)
  - releaseYear (string)
  - coverArtUrl (string)
  - mbid (string) - MusicBrainz ID
  - rank (integer) - User's ranking position

The application uses API key authorization for simplicity, with the key expiring after 30 days.

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/react/start/quickstart/#deploy-a-fullstack-app-to-aws) of the Amplify documentation.

```
amplify push
```

This will provision the necessary AWS resources (Cognito, AppSync, DynamoDB) and deploy your backend. To deploy the frontend:

```
npm run build
amplify publish
```

## Contributing

We welcome contributions to the The Gauntlet project! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest features.

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct). For more information, see the [Code of Conduct](CODE_OF_CONDUCT.md) file.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure everything works as expected
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Follow the existing code style
- Use meaningful variable and function names
- Write comments for complex logic
- Include TypeScript types for all functions and variables

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for information on reporting security issues.

## License

This project is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file for details.