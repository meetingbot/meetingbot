# Meeting Minutes

## Meeting Information

**Meeting Date/Time:** 2024-10-02, 10:30am  
**Note Taker:** Hand-written, ChatGPT (Summarization)

## Attendees

People who attended: Jason, Sarah, Owen, Alex, Sahib + Guest (Nikos Dritsakos, CEO of SalesBop)

## Agenda Items

1. Define SRS inputs based on SalesBop's use case
2. Clarify functional, performance, and UX expectations
3. Understand integration needs and deployment priorities
4. Discuss licensing and open source strategy

## Discussion Items

### Project Goals and Use Case

- SalesBop is looking for a meeting bot that can be used by their 170-person sales team.
- Goal: Join meetings (primarily on Microsoft Teams), record them, and return high-quality audio files quickly.
- Manually pasting a meeting link is **P0**, while calendar integration is **P1** (but essential for adoption).
- Prioritizing Teams initially, with Zoom and Google Meet as follow-ups.

### Functional and Technical Requirements

- Bot must join as soon as a link is entered or calendar event starts.
- Should stay in call until it ends, detect when others leave, and exit accordingly.
- Must scale to run multiple bots in parallel.
- Audio quality is critical—should either be adjustable or fixed at decent clarity.
- Customizable bot names and avatars via API are required.
- Bot should support basic control through API: start/stop recording, set metadata, etc.

### UX and Dashboard Design

- SalesBop wants a clean UI dashboard:
  - View all bots
  - Click into individual bot for properties, logs, recordings, metadata, and config
- Universal config settings: API keys, callback URLs, etc.
- System should respond with a download link after the meeting.
- Docs and webhook setup should be easily accessible—open to svix or API-defined approach.

### Performance and Reliability

- Audio download should be ready within **2 minutes** of meeting end.
- Reliability in both joining and exiting calls is important (no hangups or stuck processes).

### Security and Compliance

- API key is acceptable for authentication.
- Self-hosted on AWS.
- Bot must clearly indicate when a call is being recorded (via voice or image/pfp).
- Legal responsibility for consent lies with the API user, not the product.

### Migration and Timeline

- No blockers expected in switching from Recall.ai.
- Needs Microsoft Teams support to begin rollout (targeting **December**).
- Wants a **working prototype within a month**.
- SalesBop uses Recall’s calendar credential model, expects similar or improved handling.

### Licensing

- Flexible on licensing but believes a more permissive open source license may attract broader adoption.

## Action Items

- **Anyone**: Implement P0 functionality (manual meeting link entry) and begin Teams integration (P1).
- **Anyone**: Start UI dashboard prototype with bot logs, recording access, and configuration options.
- **Anyone**: Build out API for joining meetings, uploading PFPs, naming bots, and toggling features like recording.
- **Anyone**: Ensure bot can detect call activity and exit cleanly.
- **Anyone**: Design webhook or callback model (consider svix or inline API definition).
- **Anyone**: Optimize post-meeting audio processing to meet 2-minute delivery target.
- **Anyone**: Add visible call recording indicators for compliance support.
- **Anyone**: Finalize open source license strategy to balance adoption and contribution.
