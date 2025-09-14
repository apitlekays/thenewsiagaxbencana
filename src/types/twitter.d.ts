// Twitter Widgets TypeScript declarations
declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: {
            theme?: 'light' | 'dark';
            width?: string | number;
            align?: 'left' | 'center' | 'right';
            dnt?: boolean;
          }
        ) => Promise<HTMLElement>;
        load: () => void;
      };
    };
  }
}

export {};
