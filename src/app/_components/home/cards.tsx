import React from "react";
import { Upload } from "lucide-react";

const cards = [
  {
    title: "Upload",
    description: "File, audio, video",
    icon: Upload,
  },
  {
    title: "Upload",
    description: "File, audio, video",
    icon: Upload,
  },
  {
    title: "Upload",
    description: "File, audio, video",
    icon: Upload,
  },
];

const Cards = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div key={index} className="w-full min-w-0">
            <div className="group relative cursor-pointer overflow-hidden rounded-md border border-neutral-200 bg-white shadow-[0_4px_10px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-200/40 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-800/50 dark:shadow-[0_4px_10px_rgba(0,0,0,0.06)] dark:hover:border-neutral-700 dark:hover:bg-neutral-700/50">
              {/* Blue accent line */}
              <div className="absolute bottom-0 left-0 h-px w-full bg-blue-500/80" />

              <div className="flex flex-col items-start justify-center gap-y-2 p-4">
                <div className="flex flex-row items-center gap-2.5 sm:block sm:space-y-2">
                  <Icon className="h-4 w-4" />

                  <div className="flex flex-col justify-center gap-0.5">
                    <div className="flex items-center gap-x-1">
                      <h3 className="text-primary/70 group-hover:text-primary dark:text-primary/80 text-left text-sm font-medium transition-colors sm:text-base">
                        {card.title}
                      </h3>
                    </div>

                    <p className="text-primary/50 group-hover:text-primary/80 dark:text-primary/60 line-clamp-1 text-left text-xs transition-colors sm:text-sm">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Cards;
