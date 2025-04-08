# Meeting Minutes

## Meeting Information

**Meeting Date/Time:** 2025-03-06, 2:00 PM EST
**Note Taker:** Fathom, ChatGPT (Summarization)

## Attendees

People who attended: James O'Connor, Sarah Simionescu, Jason Huang, Alex Eckardt, Sahib Khokhar, Owen Gretzinger, Nur Uddin Shohan

## Agenda Items

1. Update on the Zoom bot development and deployment.
2. Discuss challenges faced during integration and deployment.
3. Demonstrate the working prototype and architecture.
4. Discuss future improvements and architecture optimization.
5. Plan next steps and future meetings.

## Discussion Items

### Update on Zoom Bot Development
- The team successfully deployed the Zoom bot as a proof of concept.
- Initial testing completed, but challenges faced with deployment and integration on remote servers.
- Issues encountered with Docker and Terraform setup, including debugging and resource optimization.

### Challenges and Lessons Learned
- The team faced challenges combining the individual bot scripts and managing dependencies.
- Consolidated multiple bots into a single script to simplify deployment.
- Identified performance issues related to CPU and memory settings.
- Discussed the importance of validating initial architectural assumptions to avoid future refactoring.

### Demonstration and Prototype
- The team demonstrated the Zoom bot prototype and the recording flow.
- Issues identified with the delay in bot joining meetings, suggesting pre-launch scheduling to address startup latency.
- Showcased the auto-generated API documentation using Swagger, improving developer collaboration.
- Discussed cost optimization, calculating that the solution is significantly cheaper (approx. 10 cents/hour) compared to commercial options like Recall AI (1 dollar/hour).

### Future Improvements
- Improve Docker container resource allocation (e.g., CPU and RAM settings).
- Investigate potential performance improvements with faster container services like Fly.io.
- Further refine the bot architecture to reduce resource consumption.
- Plan to complete all functionality and testing by the project deadline on March 25th.
- Ensure thorough unit and end-to-end testing, especially on callback and recording functions.

### Next Meeting Setup
- Next meeting scheduled for March 31st, 2:00 PM EST.
- Team will present the final version, including all functionalities and tests.

## Action Items

- **Jason and Sarah:** Complete refactoring and optimize resource usage for bot containers.
- **James:** Review the codebase and provide feedback if needed.
- **Owen:** Finalize the API documentation and testing setup.
- **Sahib:** Test performance improvements and document the findings.
- **Anyone:** Prepare for the final project demonstration and testing by March 25th.
