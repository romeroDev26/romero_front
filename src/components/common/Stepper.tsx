// src/components/common/Stepper.tsx
import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

interface StepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full px-4 sm:px-0">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <React.Fragment key={step}>
              <div className="flex items-center text-sm">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {isCompleted ? <CheckIcon className="w-5 h-5" /> : index + 1}
                </div>
                <div
                  className={`ml-3 font-medium hidden sm:block transition-colors duration-300 ${
                    isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-auto border-t-2 transition-colors duration-500 mx-4 ${isCompleted ? 'border-green-500' : 'border-gray-300'}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

