function Loader({ size = "md", text = "Loading..." }) {
  const sizes = { sm: "w-6 h-6", md: "w-10 h-10", lg: "w-16 h-16" };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`${sizes[size] || sizes.md} border-4 border-border border-t-primary rounded-full animate-spin`} />
      {text && <p className="text-muted-foreground mt-4">{text}</p>}
    </div>
  );
}

export default Loader;
