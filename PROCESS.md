# Process: Squishy-Kuma

## 1. Starting Idea

My idea came from physical silicone squishy toys. Their soft texture and gentle sounds make squeezing them relaxing. I wanted to recreate a similar experience on phones and computers, allowing people to take a short break whenever they wanted.

<p align="center">
  <img src="https://sdmax.co.uk/wp-content/uploads/2026/09/Jumbo-Peach-Squishy-Toys-wholesale.-11%C3%9714cm.webp" width="300" alt="Peach Squishy Toy">
</p>

Since a screen cannot reproduce the physical sensation of silicone, I focused on visual deformation, bounce, and sound feedback. I also wanted users to personalise the experience by adjusting the bear’s softness and bounce.

## 2. How I Used AI

I used two AI tools during the project:

- **ChatGPT:** I described my initial idea, including the interaction, appearance, and website features. Through conversation, I refined the concept and asked ChatGPT to organise it into a requirements document.
- **Codex, using 6.1 Sol:** I provided the requirements document and used Codex to generate the code and website. I also used it to revise the model, adjust the mobile layout, and investigate an audio issue reported during testing.

I first tested the experience on my computer. The interaction and sound feedback worked in that test. I then uploaded the project to GitHub and used a GitHub Pages workflow to publish a public website.

## 3. What I reject

The first AI-generated version showed a complete bear with a body and limbs. I felt that this version looked awkward and did not match the cute, simple appearance I wanted.

![First version screenshot](docs/screenshots/first-version.png)

I supplied a reference image and asked Codex to revise the model so that it consisted only of the bear’s head.

I kept this revised design because the simpler shape made the main interaction area clearer and better matched the visual character I wanted for the experience.

## 4. User Trial

I shared the published website with friends and let them explore it before explaining the adjustment controls. I paid attention to what they discovered independently and what needed an explanation.

### Observations

- **Appearance:** They described the bear’s head as cute, which supported keeping the revised design.
- **Sound feedback:** Some testers, particularly those using iPhones, reported that they could not hear any sound. The audio had worked in my desktop test, so that test had not revealed the mobile issue.
- **Discoverability:** On mobile, the adjustment panel appeared below the main interaction area and outside the initial screen. Some testers did not discover the sliders until I pointed them out.

The clearest usability problem was that users could interact with the bear without realising that they could customise its feel.

## 5. My Response to the Trial

### Improvement 1: Make the Sliders Visible Earlier

I asked Codex to move the mobile adjustment panel directly below the title and above the bear, with both sliders visible on the initial screen.

This decision addressed the discoverability problem observed during the trial. Personalising the feel was a central part of my original idea, so the controls needed to be visible when users first opened the page.

### Improvement 2: Address the Mobile Audio Issue

I reported the audio problem to Codex because I did not initially understand its cause.

Codex identified a possible compatibility gap in the audio activation logic: the code attempted to enable audio when a press began, while the affected touch interaction could require another activation attempt when the touch ended. The release handler played a sound but did not retry audio activation.

I accepted Codex’s proposed fix to retry audio activation on release. This addressed the reported problem while preserving sound as part of the intended feedback.

The diagnosis and code fix came from Codex; my contribution was to bring the user feedback into the development process and decide to retain the sound interaction.

## 6. Reflection

The user trial revealed two issues that my desktop testing had missed: mobile audio compatibility and the visibility of the customisation controls.

It also showed that a feature can work technically but still be difficult to discover. Moving the sliders higher in the mobile layout connected the interface more clearly to my original goal: a squishy toy whose feel users can personalise.

The changes were made in response to the trial. A follow-up test would be needed to confirm whether new users now discover the sliders independently and whether sound works consistently on the affected phones.