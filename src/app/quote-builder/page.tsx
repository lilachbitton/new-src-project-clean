import { QuoteBuilder } from '@/components/quote-builder/QuoteBuilder';

interface PageProps {
  searchParams: Promise<{
    recordId?: string;
    quoteNumber?: string;
    profitUnit?: string;
  }>;
}

export default async function QuoteBuilderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  return (
    <QuoteBuilder 
      searchParams={params}
    />
  );
}