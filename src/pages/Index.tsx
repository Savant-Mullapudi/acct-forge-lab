import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="mb-4 text-4xl font-bold">Payment Portal Demo</h1>
        <p className="text-xl text-muted-foreground mb-8">Navigate to explore the payment flow</p>
        <div className="flex flex-col gap-4 items-center">
          <Link 
            to="/checkout" 
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Go to Checkout
          </Link>
          <Link 
            to="/login" 
            className="px-6 py-3 border border-input rounded-lg font-semibold hover:bg-accent transition-colors"
          >
            Go to Login
          </Link>
          <Link 
            to="/success?session_id=demo" 
            className="px-6 py-3 border border-input rounded-lg font-semibold hover:bg-accent transition-colors"
          >
            View Success Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
