<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LocationController extends Controller
{
    public function getCountries()
    {
        $path = 'locations/countries.json';
        if (!Storage::exists($path)) {
            return response()->json([]);
        }
        $data = json_decode(Storage::get($path), true);
        return response()->json($data);
    }

    public function getStates(Request $request)
    {
        $countryCode = $request->query('countryCode');
        $path = 'locations/states.json';
        if (!Storage::exists($path)) {
            return response()->json([]);
        }
        $data = json_decode(Storage::get($path), true);
        
        if ($countryCode) {
            $data = array_values(array_filter($data, function ($state) use ($countryCode) {
                return $state['countryCode'] === $countryCode;
            }));
        }
        return response()->json($data);
    }

    public function getCities(Request $request)
    {
        $countryCode = $request->query('countryCode');
        $stateCode = $request->query('stateCode');
        $path = 'locations/cities.json';
        if (!Storage::exists($path)) {
            return response()->json([]);
        }
        $data = json_decode(Storage::get($path), true);

        if ($countryCode && $stateCode) {
            $data = array_values(array_filter($data, function ($city) use ($countryCode, $stateCode) {
                return $city['countryCode'] === $countryCode && $city['stateCode'] === $stateCode;
            }));
        }
        return response()->json($data);
    }
}
