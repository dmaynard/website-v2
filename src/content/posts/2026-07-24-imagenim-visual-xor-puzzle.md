---
date: 2026-07-24
title: "ImageNim: Transforming Classic Nim Game Theory into a Visual Pixel XOR Puzzle with Rust & WebAssembly"
teaser: "Exploring the intersection of classic game theory, visual pixel manipulation, and bitwise XOR arithmetic with a Rust WebAssembly engine and React UI."
thumbnail: "../thumbnails/imagenim.png"
slug: imagenim-visual-xor-puzzle
---

# ImageNim: Transforming Classic Nim Game Theory into a Visual Pixel XOR Puzzle

For centuries, mathematicians and game theorists have been fascinated by **Nim**—a mathematical game of strategy where players take turns removing counters from distinct piles. In 1901, Harvard mathematician Charles L. Bouton proved that Nim is completely solved using binary arithmetic and the bitwise XOR operation (⊕). The binary XOR sum of pile sizes, often called the **Nim-sum**, dictates whether a game state is a winning or losing position.

I actually had the idea for this game about 15 years ago and originally implemented it as a Java desktop application. While working on recent web projects like [Cyclic Demons](/blog/cyclic-demons) and exploring high-performance browser technology, I realized I could easily build a modern web version of **ImageNim**: an interactive visual puzzle game where instead of numbers or matchsticks, players manipulate full RGBA pixel buffers using real-time bitwise XOR operations.

![ImageNim Game Interface](../images/imagenim.png)

You can play with the live application right now in your browser:  
👉 **[Play ImageNim Live](https://imagenim.netlify.app/)**  
*(Source code available on [GitHub](https://github.com/dmaynard/ImageNim))*

---

## 🎨 How ImageNim Works: Visual Bitwise XOR

In standard digital graphics, blending two image layers usually involves alpha compositing or additive blending. In **ImageNim**, images are blended using **pure bitwise XOR (⊕) logic** applied to raw RGB byte buffers.

The game layout surrounds a central target canvas with **8 outer image cards**. When you click an outer image card, its pixel buffer is XORed directly into the central canvas:

$$R_{\text{canvas}} = R_{\text{canvas}} \oplus R_{\text{card}}, \quad G_{\text{canvas}} = G_{\text{canvas}} \oplus G_{\text{card}}, \quad B_{\text{canvas}} = B_{\text{canvas}} \oplus B_{\text{card}}$$

Because bitwise XOR possesses three key mathematical properties, the visual mechanics feel both magical and intuitive:
1. **Self-Inverse (A ⊕ A = 0):** Clicking an image card a second time immediately toggles that layer off, canceling out its contribution pixel-by-pixel.
2. **Identity (A ⊕ 0 = A):** An all-black canvas (where RGB bytes are zero) acts as the identity element. XORing any image into black yields the exact original image.
3. **Commutativity (A ⊕ B = B ⊕ A):** The order in which you click the image cards does not matter—the resulting composite image depends strictly on *which* set of cards is selected.

---

## 🕹️ Game Modes & Features

ImageNim features versatile game modes, difficulty levels, move scoring, and custom asset capabilities:

### 🧩 1-Player Solitaire Mode
In Solitaire mode, the central canvas starts pre-loaded with a complex composite image created by XORing a secret random subset of the outer cards. Your goal is to clear the canvas back to **solid black** ($0$) in the fewest moves possible.

Because $A \oplus A = 0$, finding the solution means discovering the exact combination of cards that were originally used to generate the puzzle.

#### ⭐ Performance Score Ratings
At the end of each solitaire game, your solution is evaluated based on how close your total moves are to the minimum *Optimal Score*:
* **Perfect Score:** Solved in the minimal optimal moves.
* **Great:** Solved within 2 moves over optimal.
* **Good:** Solved within 4 moves over optimal.

### ⚔️ 2-Player Versus Mode
In 2-Player Versus mode, two players take turns dueling on the same device. Each player is secretly assigned a unique target card. On each turn, a player selects one outer card to toggle its pixels on the shared central canvas. 

The first player to make the central canvas match their assigned target card wins!

### 🌱 Easy vs 🔥 Hard Difficulty
ImageNim offers customizable difficulty settings:
* **Easy Mode:** Exactly 2 cards are initially XORed into the central canvas, making for an approachable entry-level puzzle.
* **Hard Mode:** A random selection of 3 to 8 cards is XORed together, producing significantly more intricate composite targets.

### 🔍 Explore Mode
Turn **Explore Mode** ON to freely experiment with XOR tile combinations without triggering endgame popups. It serves as a visual sandbox for studying how color channels interact. Turning Explore Mode OFF restarts the puzzle.

### 🖼️ Custom Image Set Uploads & Built-in Themes
Players can select from curated built-in photography theme packs—including **Bryce Canyon**, **Zion National Park**, **Flowers & Flora**, and **Sunsets & Skies**—or upload 8+ photos from their device or camera roll to play with custom image sets.

---

## 🧮 The Math: Nim-Sum as a Linear Vector Space over $\mathbb{F}_2$

Why does XOR work so naturally for puzzle generation?

In linear algebra, the set of binary vectors of length $N$ forms a vector space over the finite field $\mathbb{F}_2$ (where addition is XOR). In ImageNim, if an image contains $W \times H$ pixels with 3 color channels (8 bits per channel), the entire image can be represented as a high-dimensional vector in $\mathbb{F}_2^{24 \cdot W \cdot H}$.

Selecting a card is equivalent to adding a basis vector to our current state. 

When generating a puzzle, the system picks a bitmask $M \in \{0, 1\}^8$. The target canvas state $C$ is constructed as:

$$C = \bigoplus_{i=0}^{7} M_i \cdot I_i$$

Because the vector space is linear over $\mathbb{F}_2$, solving the puzzle is equivalent to finding $M$ such that $C \oplus \left(\bigoplus M_i I_i\right) = 0$. Since each card toggles independently, every initial puzzle configuration has a unique minimal solution!

---

## ⚡ High-Performance Architecture: Rust + WASM + React

Performing real-time XOR bitwise math across thousands or millions of pixel bytes at 60 frames per second can place a heavy burden on JavaScript engines if not carefully engineered. Passing large byte arrays across the JavaScript/DOM boundary frequently causes severe garbage collection spikes.

To deliver sub-millisecond responsiveness, ImageNim uses a hybrid architecture:

```
┌─────────────────────────────────────────┐
│          React + TypeScript UI          │
│  (State, Card Grid, Controls, Canvas)   │
└────────────────────┬────────────────────┘
                     │ Zero-Copy Shared Memory
┌────────────────────▼────────────────────┐
│      Rust + WebAssembly Core Engine     │
│  (xor_buffers, Knuth Sampling, LCG)     │
└─────────────────────────────────────────┘
```

### 1. Zero-Copy WebAssembly Shared Memory
The Rust core crate (`wasm-bindgen`) allocates static RGBA pixel buffers directly inside the WebAssembly memory sandbox. When the user toggles an image card, JavaScript passes the pointer offset to Rust, and Rust executes the bitwise XOR loop in compiled native assembly:

```rust
#[wasm_bindgen]
pub fn xor_buffers(target: &mut [u8], src: &[u8]) {
    let len = target.len().min(src.len());
    let mut i = 0;
    while i + 3 < len {
        target[i] ^= src[i];         // Red
        target[i + 1] ^= src[i + 1]; // Green
        target[i + 2] ^= src[i + 2]; // Blue
        target[i + 3] = 255;          // Opaque Alpha
        i += 4;
    }
}
```

The HTML5 `<canvas>` context then paints the modified pixel buffer directly out of WASM memory without duplicating arrays or allocating transient objects.

### 2. Fast Deterministic Subset Generation
Puzzle initialization relies on Knuth's algorithm and a Linear Congruential Generator (LCG) implemented in Rust to deterministically select initial card subsets and guarantee solvable puzzle states without relying on external web browser random seeds.

---

## 🚀 Conclusion

ImageNim has been a fantastic project for combining mathematical game theory with high-performance web engineering. It turns abstract bitwise XOR arithmetic into a tangible visual experience where colors flip, cancel out, and morph into complex artistic compositions.

Check out the live game, upload your own images, or explore the codebase:

- 🎮 **Live App:** [https://imagenim.netlify.app/](https://imagenim.netlify.app/)
- 💻 **GitHub Repository:** [https://github.com/dmaynard/ImageNim](https://github.com/dmaynard/ImageNim)
