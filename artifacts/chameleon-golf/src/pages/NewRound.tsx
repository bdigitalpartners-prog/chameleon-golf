import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetCourses } from "@workspace/api-client-react";
import { useCreateRound } from "@/hooks/use-golf";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const formSchema = z.object({
  courseId: z.coerce.number().min(1, "Please select a course"),
  playerName: z.string().min(1, "Player name is required"),
  date: z.string().min(1, "Date is required")
});

export default function NewRound() {
  const [, setLocation] = useLocation();
  const { data: courses, isLoading: coursesLoading } = useGetCourses();
  const createRound = useCreateRound();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: 0,
      playerName: localStorage.getItem("lastPlayerName") || "",
      date: format(new Date(), 'yyyy-MM-dd')
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Save name for next time
    localStorage.setItem("lastPlayerName", values.playerName);
    
    // Convert YYYY-MM-DD to full ISO datetime string needed by the API schema
    const dateIso = new Date(values.date).toISOString();

    createRound.mutate({
      data: {
        courseId: values.courseId,
        playerName: values.playerName,
        date: dateIso
      }
    }, {
      onSuccess: (newRound) => {
        setLocation(`/rounds/${newRound.id}/play`);
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto mt-4">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold mb-2">Start a Round</h1>
        <p className="text-muted-foreground">Select a course and head to the first tee.</p>
      </div>

      <Card className="shadow-lg border-slate-200/60 p-2 sm:p-4">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Course</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(parseInt(val))} 
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses?.map(course => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name} ({course.holes} holes)
                          </SelectItem>
                        ))}
                        {courses?.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground text-center">No courses found. Add one first.</div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="playerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Player Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Tiger Woods" className="h-12 text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12 text-base block w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold shadow-md shadow-primary/20"
                  disabled={createRound.isPending || !courses || courses.length === 0}
                >
                  {createRound.isPending ? "Setting up..." : "Tee Off"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
