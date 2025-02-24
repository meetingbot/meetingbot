# Contributing to Meeting Bot

Thank you for your interest in contributing to Meeting Bot! This document provides guidelines for contributing to the project.

## Project Structure

The project is divided into four main components, each with its own README:

- `src/frontend/` - The Next.js web application (only used for frontend) providing an interface for users to create an account, manage API keys and monitor bot resources, logs and usage, README [here](src/frontend/README.md)
- `src/backend/` - The Express API server is mainly used for the user's application to interact with, deploy bots, fetch downloads ect. Swagger docs are available at the root endpoint, and Auth.js for Express is used for authentication, README [here](src/backend/README.md)
- `src/bots/` - The bot scripts for Google Meet, Zoom and Microsoft Teams, which are compiled into Docker images and deployed to AWS ECR, README [here](src/bots/README.md)
- `src/terraform/` - The Terraform code for the AWS infrastructure, README [here](terraform/README.md)

Please refer to the specific `README` in each directory for detailed setup and development instructions.

## Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env` in the frontend, backend and bots directories, refer to the specific `README` in each directory for more information
3. Install dependencies in each directory:
   ```bash
   cd src/frontend && npm install
   cd src/backend && npm install
   cd src/bots && npm install
   ```

## Development Workflow

1. Create a new branch for your feature/fix
2. Make your changes
3. ~~Ensure all tests pass~~ _TODO: We don't have tests yet_
4. Submit a pull request

## Getting Help

If you need help or have questions:

1. Check the component-specific README files
2. Review existing issues
3. Create a new issue with detailed information

## License

By contributing to Meeting Bot, you agree that your contributions will be licensed under the project's license. See [LICENSE](LICENSE) for more information.
