# TA Grading Instructions

Hello! Thanks for your time.

This is a simple instruction for you to follow to get the bot up and running in your local environment.
This is a way you can see and run everything yourself.
If you have any questions, please feel free to message any of us on Teams.

## Using the Hosted Example Application 

We have provided a hosted example application that you can use to test out the bots.
You can find the example application at [https://example-meetingbot.netlify.app/](https://example-meetingbot.netlify.app/).

## Self Hosted Example Application

### Prerequisites

- AWS CLI
- Node.js (v18 or later)
- Docker
- Terraform

### Setup on AWS

If you decide to test Terraform and setting up on AWS, you'll need to have an AWS account and the AWS CLI installed and configured on your machine. 
You can follow the instructions in the [AWS CLI documentation](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) to set it up.

We recorded this this [setup guide](https://x.com/owengretzinger/status/1909450692999209465) for setting up this project on your own AWS Account using Terraform.

You can use this application to send and receive the bots' recordings. Please note that using the example app to send bots will take some spin-up time ~ expect around 45 seconds for the bot to join the meeting.
## Getting Started Locally

1. Clone the repository:
```bash
git clone <repository-url-provided>
```

2. Navigate to the project directory:
```bash
cd meetingbot
```

3. Install dependencies: (sorry)
```bash
pnpm install
cd src/bots
pnpm install
cd ../server
pnpm install
cd ../example-app
pnpm install
cd ../landing-page
pnpm install
```

### Create Environment Variables

Setup the environment variables in each of the following directories:
- `src/bots`
- `src/server`
- `src/example-app`

If you want to use the example app to send and test out bots, you will need to create an API key through the front-end (This is because we use the public route to send, and you need to sign into Github to create a key).

Run the server application using
```bash
cd src/server
pnpm dev
```

This will allow you to generate keys.

---

## Testing

### Example App

If you decide to run the local example app, you will need to set up the environment variables in the `src/example-app` directory.

Setup the environment variables to point to your local server, or a deployed one.

Then, in a new terminal, run the example app using
```bash
cd src/example-app
pnpm dev
```

### Local Development

If you don't want to use the example app to send and test out bots, but instead run the bots manually, you can do so by running the following commands.

See the README in `src/bots` for more information on how to run bots manually.

```bash
cd src/bots
pnpm tsx envBotData.ts
docker build -f <PLATFORM>/Dockerfile -t <PLATFORM> .
docker run --env-file .env <PLATFORM>
```
(where `<PLATFORM>` is the platform you want to run, one of `meet`,`zoom`,`teams`)

This will run the bot in a Docker container, and you can see the logs in the terminal.