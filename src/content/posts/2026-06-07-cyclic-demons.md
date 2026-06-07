---
date: 2026-06-07
title: "Chasing Cyclic Demons: Building a 2D Cellular Automaton in the Browser with Rust & WebAssembly"
teaser: "Building a high-performance 2D cellular automaton in the browser with Rust and WebAssembly, and chasing the N+1 halting mystery."
thumbnail: "../images/Monarch.png"
slug: cyclic-demons
---

# Chasing Cyclic Demons: Building a 2D Cellular Automaton in the Browser with Rust & WebAssembly

There is something inherently mesmerizing about cellular automata. You define a set of simple, localized rules, hit "play," and watch as complex, macroscopic patterns emerge from chaos. 

Recently, I decided to build a browser-based visualization of a specific type of cellular automaton called **Cyclic Space**, discovered by David Griffeath of the University of Wisconsin in 1990 and detailed in A.K. Dewdney's *The Magic Machine*. 

In Cyclic Space, each cell is assigned a state (a color) from `0` to `N-1`. The rule is simple: a cell is "eaten" by a neighboring cell (up, down, left, or right) if that neighbor’s state is exactly one step ahead in the cycle. Color `N-1` is eaten by color `0`. The cells wrap top-to-bottom and left-to-right in a toroidal geometry.

You can play with the live version here: **[live version](https://cyclicdemons.netlify.app/)**  
*(Source code available on [GitHub](https://github.com/dmaynard/cyclicdemons))*

---

## 🚀 The Tech Stack: Why Rust and WebAssembly?

I wanted this to be a highly interactive web app where users could drag-and-drop their own images, have the system extract the colors, and run the automaton on those exact colors. 

Running a pixel-by-pixel simulation on high-resolution images (potentially over a million pixels) at 60 frames-per-second is tough in pure JavaScript. To solve this, I split the architecture:
*   **The Frontend (React + TypeScript):** Handles the UI, drag-and-drop file inputs, and paints the final output to an HTML5 `<canvas>`.
*   **The Engine (Rust + WASM):** Handles all the heavy mathematical lifting and grid traversal. 

By using WebAssembly, I could allocate a static chunk of memory (a **Zero-Copy Buffer**) within the WASM sandbox. Rust writes the modified image pixels directly into this shared memory buffer, and the JavaScript `<canvas>` reads from it directly without any cloning or garbage collection. While the exact framerate still depends on the size of the uploaded image, this architecture allows the simulation to run orders of magnitude faster (and on much larger images) than a pure JavaScript implementation could handle. Of course, having static mutable arrays in Rust is antithetical to Rust's philosophy, so the code is littered with `unsafe` blocks. But being an old game programmer, sometimes you gotta do what you gotta do for performance.

## 🎨 Dynamic States via Median Cut Quantization

Instead of hardcoding a set of colors, the states of the automaton are generated dynamically based on whatever image the user uploads. 

When you drop an image onto the canvas, the Rust core runs a custom implementation of the **Median Cut algorithm**. It scans the millions of pixels in the image and efficiently clusters them into a deterministic color palette (e.g., the top 16 or 32 distinct colors that represent the image). 

Those colors then become the exact states of the `0` to `N-1` cycle.

## 🤯 The "Aha!" Debugging Moment: Finding the Halting Period

One of the most interesting challenges during development was figuring out **when to halt the simulation**. 

Depending on the image and the number of colors, you generally see three distinct behaviors in Cyclic Space:
1. **Perfect Equilibrium:** With larger numbers of colors, the simulation eventually reaches a state where no pixels change from frame to frame. The simulation can easily halt here.
2. **Full-Image Oscillations:** Sometimes, the grid enters a state where *every single pixel* changes on every frame. Since this is perfectly stable, we can also halt.
3. **Cyclic Demons:** With smaller numbers of colors, spirals of color form. These "demons" continue to grow until they fill the image or collide with other spirals. 

This third case was the trickiest. In many runs, the grid reaches a state where *almost* every pixel changes every frame, but never quite all of them. The image appears to go through a repeating cycle, but because the pixel change count never hits 0 or 100%, the simulation runs indefinitely. To prevent infinite loops, we needed a way to detect this cycle and halt.

Logically, if there are `N` colors in the cycle, you would expect an individual cell to return to its original state exactly every `N` frames. Therefore, the global count of changed pixels should also repeat with a perfect period of `N`. 

I wrote a test to track this: keep a sliding window array of the last `N` frame change counts. If the current number of changed pixels exactly matches the number from `N` frames ago, start incrementing a `Synced` counter. If `Synced > N`, halt.

**It didn't halt.** 

I suspected a bug in my implementation. To find out what was happening, I added a "dump history" button to output the last 256 frame-change counts to a text file for manual analysis. 

When I analyzed the log, I found something fascinating. The sequence *was* perfectly repeating, but **the period was exactly N+1**. 

I have no idea why this is true. If you have any insights into the mathematics behind why the global period requires that extra frame, please let me know! 

Some images enter the `N+1` cycle as soon as the demons fill the screen; for others, it takes much longer. My current hypothesis is that *all* images containing one or more cyclic demons will eventually reach an `N+1` cycle and terminate. I cannot prove this mathematically yet, nor have I found a counter-example. But updating the halting logic to look back `N+1` frames worked instantly. The moment the board crystallizes into stable spirals, the automaton perfectly detects the cycle and halts.

## Conclusion

Building this was a fantastic exercise in optimizing browser performance and a great reminder of how unpredictable emergent systems can be. The math isn't just theory—it actively dictates how you have to write your termination loops!

If you want to try it out, upload a picture of your dog or your favorite album cover and watch the demons take over.

*Check out the [Live Demo](https://cyclicdemons.netlify.app/) or dig into the [GitHub Repo](https://github.com/dmaynard/cyclicdemons).*
