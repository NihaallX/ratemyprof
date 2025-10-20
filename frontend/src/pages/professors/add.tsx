import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import AddProfessorForm from '@/components/AddProfessorForm';

const AddProfessorPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Add Professor - RateMyProf</title>
        <meta name="description" content="Add a new professor to RateMyProf database" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Add New Professor</h1>
            <p className="mt-2 text-lg text-gray-600">
              Can't find your professor? Help other students by adding them to our database!
            </p>
          </div>
          
          <AddProfessorForm />
        </div>
      </div>
    </>
  );
};

export default AddProfessorPage;