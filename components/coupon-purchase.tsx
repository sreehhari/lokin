"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Coins, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";


const coupons = [
  {
    id: 1,
    name: "10% Off Electronics",
    description: "Get 10% off on all electronics",
    price: 100,
  },
  {
    id: 2,
    name: "Free Shipping",
    description: "Free shipping on your next order",
    price: 50,
  },
  {
    id: 3,
    name: "Buy One Get One Free",
    description: "BOGO on selected items",
    price: 200,
  },
  {
    id: 4,
    name: "$5 Off $50 Purchase",
    description: "$5 discount on orders over $50",
    price: 75,
  },
  {
    id: 5,
    name: "20% Off Clothing",
    description: "20% discount on all clothing items",
    price: 150,
  },
];

export function CouponPurchase() {
  const [userCoins, setUserCoins] = useState<number | null>(null);
  const { toast } = useToast();
  const { data: session } = useSession();

  const userId = (session?.user as { id?: string | number })?.id;
  const userEmail = (session?.user as { email?: string })?.email;

  useEffect(() => {
    const fetchCoins = async () => {
      if (!userEmail) return;
      try {
        const res = await fetch(
          `/api/coingetter?id=${encodeURIComponent(userEmail)}`
        );
        if (!res.ok) throw new Error("Failed to fetch coin balance");
        const data = await res.json();
        setUserCoins(data.points);
      } catch {
        setUserCoins(0);
      }
    };
    fetchCoins();
  }, [userEmail]);

  const handlePurchase = async (couponId: number, price: number) => {
    if (userCoins !== null && userCoins >= price) {
      setUserCoins(userCoins - price);
      toast({
        title: "Coupon Purchased!",
        description: "The coupon has been added to your account.",
      });

      if (!userId) {
        toast({
          title: "User not found",
          description: "You must be logged in to purchase a coupon.",
          variant: "destructive",
        });
        return;
      }
      try {
        const res = await fetch("/api/coinsubtractor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            amount: price,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update points");
        }

        if (userEmail) {
          const refetch = await fetch(
            `/api/coingetter?id=${encodeURIComponent(userEmail)}`
          );
          if (refetch.ok) {
            const data = await refetch.json();
            setUserCoins(data.points);
          }
        }
      } catch (err: unknown) {
        toast({
          title: "Error updating points",
          description:
            err instanceof Error ? err.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Insufficient Coins",
        description: "You don't have enough coins to purchase this coupon.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Coupon Store</h1>
        <div className="flex items-center justify-center text-lg">
          <Coins className="mr-2 h-5 w-5" />
          <span>
            Your Balance: {userCoins === null ? "..." : userCoins + " coins"}
          </span>
        </div>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => (
          <Card key={coupon.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {coupon.name}
              </CardTitle>
              <CardDescription>{coupon.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-2xl font-bold text-primary">
                {coupon.price} coins
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handlePurchase(coupon.id, coupon.price)}
                disabled={userCoins === null || userCoins < coupon.price}
              >
                {userCoins !== null && userCoins >= coupon.price
                  ? "Purchase Coupon"
                  : "Not Enough Coins"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center">
          <AlertCircle className="mr-2 h-4 w-4" />
          Coupons are for demonstration purposes only and do not represent real
          offers.
        </p>
      </footer>
    </div>
  );
}
