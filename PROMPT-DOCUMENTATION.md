# Prompt Documentation

This log records the user prompts and significant follow-ups that shaped the
Health+ website work. It covers the project conversation, not private system or
developer instructions. A credential-like value submitted in an endpoint field
is intentionally omitted.

## Prompts and revisions

1. **Project evaluation context**

   > Your submission will be assessed on practical use of AI tools, prompt
   > engineering skills and iterative improvement, creativity and innovation,
   > problem-solving and technical execution, quality and usefulness of the
   > final outcome, and ability to explain your decisions and demonstrate what
   > you have built.

2. **Choose a project direction**

   > Polish the healthcare website.

   No additional design constraints were supplied. This led to a responsive
   visual redesign that retained the existing site and appointment flow.

3. **Fix a runtime error**

   > `Cannot read properties of undefined (reading 'TOP_CENTER')`
   >
   > fix

   The error report identified the Live Chat click handler. The correction was
   applied to all notification calls using the same unsupported Toastify
   position constant, and a regression test was added.

4. **Add AI chat**

   > add live chat with ai

   The integration choice was clarified. The selected direction was an
   OpenAI-compatible API accessed through a server-side backend, keeping API
   credentials out of browser code. A credential-like value submitted as
   endpoint details was not recorded or used; the user was advised to rotate it
   if it was real.

5. **Follow up on an API parsing error**

   > Unexpected token '<', `"<!DOCTYPE "...` is not valid JSON this erroe

   This prompted checks for an API request receiving the React HTML fallback.
   The client gained clearer handling for non-JSON responses, and the
   development startup script was updated to launch both the API and frontend.

6. **Clarify the remaining setup requirement**

   > AI chat isn't configured yet. Please contact the site team.

   The local environment was checked without displaying any secret values. No
   `.env` file or AI key was present, so the server response and setup guidance
   were made actionable.

7. **Document the setup response**

   > AI chat isn't configured. Copy .env.example to .env, set AI_API_KEY to a
   > valid provider key, then restart npm start.

   This follow-up confirmed the API key was still not configured. The required
   local setup and restart steps were explained; no key was requested in chat.

8. **Current documentation request**

   > Prompt Documentation
   >
   > Provide a document containing all the prompts you used to develop your
   > project. Include any significant prompt revisions or follow-up prompts
   > that helped improve the results. This will help us understand your thought
   > process and how effectively you interact with AI tools.
   >
   > tell anwer

## Iteration and implementation outcomes

- Started by inspecting the existing React pages, reusable components, styles,
  and assets before making changes.
- Kept the redesign within the existing app structure and added responsive
  styling and accessible keyboard behavior.
- Replaced the homepage's duplicate booking form with a real About section.
- Built an AI chat widget and an Express `/api/chat` endpoint. Added request
  validation, provider timeouts, JSON error handling, and a medical-safety
  system prompt.
- Tested the frontend and backend independently, then exercised the development
  proxy in a browser and over HTTP.
- Found that the local app had no AI provider configuration. Documented
  `.env.example` setup while keeping actual credentials out of source control
  and browser code.

## Validation

- Frontend tests cover the homepage, AI chat interaction, HTML-response
  handling, missing-key guidance, and mobile navigation.
- Backend tests cover input validation, missing configuration, provider
  forwarding, and secure provider URLs.
- The production frontend build completed successfully.
