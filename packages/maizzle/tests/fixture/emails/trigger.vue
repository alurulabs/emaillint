<template>
  <!-- Load-bearing: Maizzle's inlineLink transformer resolves this href to run the Tailwind pipeline; removing it silently skips CSS compilation. -->
  <link rel="stylesheet" href="../tailwind.css">
  <div>
    <p>Trigger template</p>
    <a href="https://example.com" class="rounded-lg bg-blue-500 text-white px-4 py-2">Click</a>
  </div>
</template>
