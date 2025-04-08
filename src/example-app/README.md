# Example Application

This is an example application with the intention of helping you understand how the project can intergrate into your own code bases.
Thus, this application is a skeleton project with its own standalone front and backend, created using Next.JS.

It allows you to enter a meeting link. A meeting bot will be summoned to the meeting and will start recording.

After the meeting, the recording will be available in the interface, and there is a button to transcribe & summarize the meeting using AI.

## Running

Ensure the backend and frontend are both running before you start the example app.
Alternativley, you can modify your example application to point to a hosted backend.

### Install dependencies
```bash
cd src/example-app
pnpm install
```

### Setup environment variables
Copy the environment variables from the example file.
```bash
cd src/example-app
cp .env.example .env
```
Fill in the necessary values.

### Run the development server:
```bash
cd src/example-app
pnpm run dev
```

It will run on port 3002.

Important: if using an external backend, make sure you host and forward port 3002 using an application like ngrok.
This will allow the MeetingBot application to communicate with this application. 

```bash
ngrok http 3002
```