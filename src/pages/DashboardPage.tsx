
const Index = () => {
  return (
    <div className="container mx-auto py-10">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold font-inter mb-4 text-primary">Welcome to SmartLesson!</h1>
        <p className="text-xl text-muted-foreground font-roboto">
          Your journey to intelligent learning starts here.
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-card p-6 rounded-lg shadow-lg border">
          <h2 className="text-3xl font-inter font-semibold mb-3">Interactive Courses</h2>
          <p className="text-muted-foreground mb-4">
            Explore a wide range of courses designed to enhance your skills and knowledge.
            Engage with interactive lessons and track your progress seamlessly.
          </p>
          <button className="btn btn-primary">Explore Courses</button>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-lg border">
          <h2 className="text-3xl font-inter font-semibold mb-3">Personalized Learning</h2>
          <p className="text-muted-foreground mb-4">
            Our platform adapts to your learning style, providing a customized experience.
            Achieve your goals faster with tailored content and recommendations.
          </p>
          <button className="btn btn-secondary">Get Started</button>
        </div>
      </section>

      <section className="text-center">
        <h3 className="text-2xl font-inter font-semibold mb-4">Ready to Begin?</h3>
        <p className="text-lg text-muted-foreground mb-6">
          Sign up today and unlock a world of knowledge.
        </p>
        <button className="btn btn-primary px-8 py-3 text-lg">Join SmartLesson Now</button>
      </section>
    </div>
  );
};

export default Index;
