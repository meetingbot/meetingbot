import { openApiDocument } from "~/lib/swagger";
import ReactSwagger from "./react-swagger";



export default async function IndexPage() {
  const spec = openApiDocument;
  return (
    <section className="container">
      <ReactSwagger spec={spec as unknown as Record<string, unknown>} />
    </section>
  );
}
