/// <reference types="react" />
/// <reference types="react-dom" />

// Ensure JSX is properly recognized
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};