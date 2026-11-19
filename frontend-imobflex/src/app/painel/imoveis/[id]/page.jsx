import PropertyEditor from "@/features/PropertyEditor";
export default async function Page({ params }) {
  const { id } = await params;
  return <PropertyEditor id={id} />;
}
