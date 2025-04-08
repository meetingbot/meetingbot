# Meeting Minutes

## Meeting Information

**Meeting Date/Time:** 2024-09-26, 10:10am  
**Note Taker:** Hand-written, ChatGPT (Summarization)

## Attendees

People who attended: Jason, Sarah, Owen, Alex, Sahib + Guest (Sam Cormier-Iijima)

## Agenda Items

1. Define inputs for SRS (Software Requirements Specification) Document
2. Gather expectations for technical, functional, and compliance requirements
3. Understand UX and integration needs
4. Discuss deployment, scheduling, and system limitations

## Discussion Items

### Project Goals and Functional Scope

- Sam provided guidance to help shape the SRS document.
- Fellow is primarily focused on transcription from Google Meet, which accounts for 70–80% of their calls.
- Emphasis on low-cost, lightweight solutions, suggesting firecracker VMs via fly.io.
- Desire for real-time transcription and video syncing without full transcoding.
- Open to using captions for transcription to avoid processing overhead.

### Technical Constraints and Scheduling

- Minimize compute cost; avoid GPU usage and video re-encoding.
- Bot should join meetings quickly (within 5 seconds) or be scheduled in advance.
- Kubernetes is preferred over Terraform for orchestration.
- Avoid screen scraping; take direct video streams when possible.

### UX, API, and Control Panel

- REST API desired, potentially with WebSocket support for live transcription.
- Interest in a Recall-style copilot feature for real-time Q&A.
- Would like a control panel to persist state transitions, speaker events, and handle bot disconnects.

### Performance and Security

- Expect transcript availability shortly after the meeting ends.
- API key is acceptable for authentication; internal deployments reduce security overhead.
- Google Meet has a 50-call concurrency limit; multiple bot users or anonymous join needed.
- Bot should support display name/pfp changes and timeout handling for idle meetings.

### Compliance and Legal Considerations

- No immediate compliance expectations; a security audit may happen later.
- Recording consent (2-party jurisdictions) is the user’s responsibility, not the tool's.
- Need ability to pause/stop recording mid-call and support bot posting in Meet chat.

### Migration and Future Compatibility

- No technical blockers to switching from Recall.
- Existing scheduling will remain in place for now.
- Frustrations with Recall’s slow feature adoption and centralized failure risk.

### Browser Automation and Extension Use

- Google Meet may block traditional scrapers—Puppeteer with stealth plugin recommended.
- Most logic should be moved into a Chrome extension, minimizing WebDriver use.
- Video/audio separation noted; subtitles should be embedded in output video.

### Licensing

- AGPL preferred to protect open source integrity, though MIT is also acceptable.
- Fellow is broadly supportive of open source licensing.

## Action Items

- **Anyone**: Finalize and move all confirmed items into the SRS document.
- **Anyone**: Explore Puppeteer + Chrome extension for stealthy and flexible automation.
- **Anyone**: Investigate lightweight transcription using captions.
- **Anyone**: Build out REST API with optional WebSocket for live features.
- **Anyone**: Prototype fast-launching bot infrastructure with fly.io/firecracker.
- **Anyone**: Design control panel for tracking speaker transitions and bot presence.
- **Anyone**: Plan for scaling Meet bot concurrency and anonymous joining.
- **Anyone**: Decide on licensing (AGPL vs. MIT) for open source release.
