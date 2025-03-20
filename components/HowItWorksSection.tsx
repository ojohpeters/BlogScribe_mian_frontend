"use client"

import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Check, Clock, Edit, Image, Key, Lock, Save, Shield, Tag } from "lucide-react"

export default function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
            How BlogScribe AI Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            BlogScribe AI is designed to make blogging effortless by integrating AI-powered content generation with
            direct WordPress publishing and Other cool features.
          </p>
        </motion.div>

        {/* How it works steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {[
            {
              title: "1. Connect Your WordPress Site",
              description:
                "To start using BlogScribe AI, users need to connect their WordPress site. This is done using a secure App Password, which allows BlogScribe AI to interact with WordPress without exposing your actual login credentials.",
              icon: <Key className="h-10 w-10 text-primary" />,
            },
            {
              title: "2. Generate AI-Powered Content",
              description:
                "Users can enter a topic, keywords, or a brief description, and BlogScribe find latest posts regarding it and will generate a well-structured blog post.",
              features: [
                "SEO-friendly content",
                "Markdown formatting for perfect WordPress integration",
                "Inclusion of images, categories and tags",
              ],
              icon: <Save className="h-10 w-10 text-primary" />,
            },
            {
              title: "3. Edit & Customize Your Post",
              description: "Before publishing, users can:",
              features: ["Modify the AI-paraphrased content", "Add or change images", "Assign categories and tags"],
              featureIcons: [
                <Edit key="edit" className="h-4 w-4" />,
                <Image key="image" className="h-4 w-4" />,
                <Tag key="tag" className="h-4 w-4" />,
              ],
              icon: <Edit className="h-10 w-10 text-primary" />,
            },
            {
              title: "4. Publish or Schedule",
              description: "Once satisfied, users can:",
              features: [
                "Publish instantly to WordPress",
                "Save drafts to refine later",
              ],
              featureIcons: [
                <Check key="check" className="h-4 w-4" />,
                <Clock key="clock" className="h-4 w-4" />,
                <Save key="save" className="h-4 w-4" />,
              ],
              icon: <Clock className="h-10 w-10 text-primary" />,
            },
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm hover:bg-card/80">
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="mb-4 p-2 w-fit rounded-lg bg-primary/10">{step.icon}</div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>

                    {step.features && (
                      <ul className="space-y-2 mt-auto">
                        {step.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start">
                            {step.featureIcons ? (
                              <span className="mr-2 text-primary mt-0.5">{step.featureIcons[featureIndex]}</span>
                            ) : (
                              <Check className="h-4 w-4 mr-2 text-primary mt-0.5" />
                            )}
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* App Password Section */}
        <div className="mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
              How to Generate an App Password in WordPress
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              For BlogScribe AI to securely interact with WordPress, users must create an App Password in their
              WordPress dashboard.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Step 1: Log in to Your WordPress Admin Panel",
                description: "Go to wp-admin of your WordPress site.",
                icon: <Key className="h-8 w-8 text-primary" />,
              },
              {
                title: "Step 2: Navigate to Application Passwords",
                description: "Click Users → Profile (or edit a specific user). Scroll down to Application Passwords.",
                icon: <Lock className="h-8 w-8 text-primary" />,
              },
              {
                title: "Step 3: Generate a New App Password",
                description:
                  'Enter a name (e.g., "BlogScribe AI") to identify the password. Click Generate New Password. Copy the password shown—you won\'t be able to see it again.',
                icon: <Shield className="h-8 w-8 text-primary" />,
              },
              {
                title: "Step 4: Use It in BlogScribe AI",
                description:
                  "When setting up BlogScribe AI, enter your WordPress username and the generated App Password (instead of your actual password).",
                icon: <Check className="h-8 w-8 text-primary" />,
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-lg shadow-md p-6"
              >
                <div className="p-3 rounded-full bg-primary/10 w-fit mb-4">{step.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Why is This Secure Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-16 bg-secondary/30 rounded-xl p-8"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Why is This Secure?</h3>
              <p className="text-muted-foreground">
                WordPress App Passwords offer a secure way to grant API access without exposing your main login
                credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "No Full Access",
                  description:
                    "The App Password only works for API requests, meaning it cannot be used to log into WordPress manually.",
                  icon: <Lock className="h-6 w-6 text-primary" />,
                },
                {
                  title: "Revokable Anytime",
                  description:
                    "If you suspect unauthorized use, simply delete the App Password from your WordPress settings.",
                  icon: <Shield className="h-6 w-6 text-primary" />,
                },
                {
                  title: "Better than Storing Passwords",
                  description:
                    "Since BlogScribe AI never stores your actual WordPress password, your account remains secure.",
                  icon: <Key className="h-6 w-6 text-primary" />,
                },
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="p-2 rounded-full bg-primary/10 mt-1">{item.icon}</div>
                  <div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

