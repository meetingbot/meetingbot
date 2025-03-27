"use client";

import dynamic from "next/dynamic";

const SwaggerUI = dynamic(
  () => import("swagger-ui-react"),
  { ssr: false }
);
import "swagger-ui-react/swagger-ui.css";

type Props = {
  spec: Record<string, unknown>;
};

function ReactSwagger({ spec }: Props) {
  return <SwaggerUI spec={spec} />;
}

export default ReactSwagger;
