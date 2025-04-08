# Example application

This is an example application with the intention of helping you understand how the project can intergrate into your own code bases.
Thus, this application is a skeleton project with its own standalone front and backend, created using Next.JS.

It allows you to enter a meeting link. A meeting bot will be summoned to the meeting and will start recording.

After the meeting, the recording will be available in the interface, and there is a button to transcribe & summarize the meeting using AI.

## Running

Ensure the backend and frontend are both running. 

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm run dev
```

It will run on port 3002.

Host port 3002 using ngrok or similar.

```bash
ngrok http 3002
```

Ensure `.env` is set up correctly.

```bash
cp .env.example .env
```

