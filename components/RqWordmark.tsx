/** The crown follows the geometry of our existing Red Queen crown mark. */
export default function RqWordmark({ corp = false }: { corp?: boolean }) {
  return (
    <span className="rq-wordmark" role="img" aria-label={corp ? "RQ Corp" : "RQ"}>
      <span className="rq-wordmark-letters" aria-hidden="true">R<span className="rq-wordmark-q">
        <svg className="rq-wordmark-crown" viewBox="10 10 44 32" fill="none" aria-hidden="true" focusable="false">
          <path d="M15 39 12.5 22l11.2 9L32 13l8.3 18L51.5 22 49 39H15Z" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
          <path d="M23.7 31 29 39M40.3 31 35 39M32 13v26" stroke="currentColor" strokeWidth="1.2" />
        </svg>Q</span></span>
      {corp && <span className="rq-wordmark-corp" aria-hidden="true">CORP</span>}
    </span>
  );
}
