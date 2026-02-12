<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourCategoryRequest;
use App\Http\Requests\UpdateTourCategoryRequest;
use App\Models\TourCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardCategoryController extends Controller
{
  /** Display a listing of the resource.
   */
  public function index()
  {
    $currentUser = Auth::user();

    return Inertia::render('dashboard/categories/index', [
      'data' => TourCategory::where('user_id', '=', $currentUser->id)->get(),
    ]);
  }

  /**
   * Store a newly created resource in storage.
   * @transformer \App\Http\Resources\TourResource
   * @responseStatus 201
   */
  public function store(StoreTourCategoryRequest $request)
  {
    TourCategory::create([
      ...$request->validated(),
      'user_id' => Auth::id(),
    ]);

    return back();
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateTourCategoryRequest $request, TourCategory $category)
  {
    $category->update($request->validated());

    return back();
  }


  /**
   * Remove the specified resource from storage.
   */
  public function destroy(TourCategory $category)
  {
    $category->delete();
    return redirect()->back();
  }
}
