'use client';

import { useMemo } from 'react';
import { doc, collection, query, where, documentId } from 'firebase/firestore';
import { useDoc, useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import type { Cart, Prompt } from '@/lib/types';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Trash2, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

function CartSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <Card className="flex items-center p-4">
                    <Skeleton className="w-24 h-24 rounded-md mr-4" />
                    <div className="flex-grow space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </Card>
                 <Card className="flex items-center p-4">
                    <Skeleton className="w-24 h-24 rounded-md mr-4" />
                    <div className="flex-grow space-y-2">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-2/4" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Separator />
                        <Skeleton className="h-7 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-12 w-full" />
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}


export default function CartPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const cartRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid, 'carts', 'active') : null),
    [firestore, user]
  );
  const { data: cart, isLoading: isCartLoading } = useDoc<Cart>(cartRef);

  const promptsQuery = useMemoFirebase(() => {
    if (!firestore || !cart?.promptIds || cart.promptIds.length === 0) {
      return null;
    }
    return query(collection(firestore, 'prompts'), where(documentId(), 'in', cart.promptIds));
  }, [firestore, cart?.promptIds]);

  const { data: cartItems, isLoading: areItemsLoading } = useCollection<Prompt>(promptsQuery);
  
  const isLoading = isCartLoading || (cart?.promptIds && cart.promptIds.length > 0 && areItemsLoading);

  const subtotal = useMemo(() => {
    if (!cartItems) return 0;
    return cartItems.reduce((acc, item) => acc + item.price, 0);
  }, [cartItems]);

  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const renderContent = () => {
    if (isLoading) {
      return <CartSkeleton />;
    }

    if (!cart || !cartItems || cartItems.length === 0) {
      return (
        <div className="text-center py-16 bg-muted/50 rounded-lg">
          <h2 className="text-2xl font-semibold">Your cart is empty.</h2>
          <p className="text-muted-foreground mt-2">Looks like you haven't added any prompts yet.</p>
          <Button asChild className="mt-6">
              <a href="/">Explore Prompts</a>
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const itemImage = item.images?.[0];
            return (
              <Card key={item.id} className="flex items-center p-4">
                <div className="relative w-24 h-24 aspect-square overflow-hidden rounded-md mr-4 bg-muted">
                  {itemImage && (
                     <Image
                        src={itemImage}
                        alt={item.title}
                        fill
                        className="object-cover"
                     />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                </div>
                <div className="flex items-center gap-4">
                   <p className="font-bold text-lg">{item.price === 0 ? 'Free' : `$${item.price.toFixed(2)}`}</p>
                   <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-5 w-5" />
                   </Button>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button size="lg" className="w-full">Proceed to Checkout</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="font-headline text-3xl md:text-4xl font-bold mb-8">Your Cart</h1>
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}
