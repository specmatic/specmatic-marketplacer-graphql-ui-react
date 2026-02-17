const http = require('http');
const { parse } = require('url');

// Serve GraphiQL interface
const serveGraphiQL = (res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>GraphiQL</title>
      <link rel="stylesheet" href="https://unpkg.com/graphiql@3.7.2/graphiql.min.css" />
    </head>
    <body style="margin: 0;">
      <div id="graphiql" style="height: 100vh;"></div>
      <script
        crossorigin
        src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"
      ></script>
      <script
        crossorigin
        src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"
      ></script>
      <script
        crossorigin
        src="https://unpkg.com/graphiql@3.7.2/graphiql.min.js"
      ></script>
      <script>
        const root = ReactDOM.createRoot(document.getElementById('graphiql'));
        root.render(
          React.createElement(GraphiQL, {
            fetcher: GraphiQL.createFetcher({ url: 'http://localhost:8080/graphql' }),
          }),
        );
      </script>
    </body>
    </html>
  `);
};

const server = http.createServer((req, res) => {
  const { pathname } = parse(req.url, true);

  if (pathname === '/graphiql') {
    serveGraphiQL(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(4000, () => {
  console.log('Server is running at http://localhost:4000/graphiql');
});